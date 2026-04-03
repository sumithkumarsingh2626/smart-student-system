import Timetable from '../models/Timetable.js';
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import { getDemoTimetableResponse, timetableDays } from '../config/timetableData.js';

const buildTimeSlot = (startTime: string, endTime: string) => `${startTime}-${endTime}`;

const sortDaySchedule = (items: any[] = []) =>
  [...items].sort((left, right) => left.time.localeCompare(right.time));

const buildClassTimetableResponse = (entries: any[] = [], fallbackClassLabel = '') => {
  const schedule: Record<string, any[]> = timetableDays.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as Record<string, any[]>);

  const allocationMap = new Map<string, { code: string; subject: string; facultyName: string }>();

  entries.forEach((entry: any) => {
    if (!schedule[entry.day]) {
      schedule[entry.day] = [];
    }

    const code = entry.subjectId?.code || entry.subjectId?.name || 'SUBJECT';
    const subject = entry.subjectId?.name || code;
    const facultyName = entry.facultyId?.name || '';
    const className = entry.classId?.name || fallbackClassLabel || '';

    schedule[entry.day].push({
      _id: entry._id,
      time: buildTimeSlot(entry.startTime, entry.endTime),
      subject: code,
      label: code,
      subjectName: subject,
      facultyName,
      class: className,
      note: entry.note || '',
      room: '',
    });

    if (!allocationMap.has(code)) {
      allocationMap.set(code, {
        code,
        subject,
        facultyName,
      });
    }
  });

  Object.keys(schedule).forEach((day) => {
    schedule[day] = sortDaySchedule(schedule[day]);
  });

  return {
    className: fallbackClassLabel,
    schedule,
    subjectAllocations: Array.from(allocationMap.values()),
  };
};

export const getTimetableByClass = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.classId)) {
    return res.json(getDemoTimetableResponse(req.params.classId));
  }

  const timetable = await Timetable.find({ classId: req.params.classId })
    .populate('subjectId', 'name code')
    .populate('facultyId', 'name')
    .populate('classId', 'name');

  if (!timetable.length) {
    return res.json(getDemoTimetableResponse(req.params.classId));
  }

  res.json(buildClassTimetableResponse(timetable, req.params.classId));
});

export const getTimetableByFaculty = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.facultyId)) {
    const fallback = getDemoTimetableResponse('2-A');
    const schedule = Object.fromEntries(
      Object.entries(fallback.schedule).map(([day, entries]) => [
        day,
        (entries as any[]).map((entry) => ({
          ...entry,
          label: entry.label || entry.subject,
        })),
      ]),
    );

    return res.json({ schedule });
  }
  const timetable = await Timetable.find({ facultyId: req.params.facultyId }).populate('subjectId classId', 'name');

  const schedule: any = timetableDays.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as Record<string, any[]>);

  timetable.forEach((entry: any) => {
    if (schedule[entry.day]) {
      schedule[entry.day].push({
        _id: entry._id,
        time: buildTimeSlot(entry.startTime, entry.endTime),
        label: entry.subjectId?.name || 'Unknown',
        subject: entry.subjectId?.name || 'Unknown',
        class: entry.classId?.name || 'Unknown',
        room: 'TBD',
        note: entry.note
      });
    }
  });

  Object.keys(schedule).forEach((day) => {
    schedule[day] = sortDaySchedule(schedule[day]);
  });

  res.json({ schedule });
});

export const createTimetable = asyncHandler(async (req: any, res: Response) => {
  const { classId, day, subjectId, startTime, endTime, note } = req.body;

  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user._id)) {
    return res.status(201).json({ message: 'Timetable created successfully (Demo Mode)', day, startTime, endTime });
  }

  const timetable = await Timetable.create({
    classId,
    day,
    subjectId,
    facultyId: req.user._id,
    startTime,
    endTime,
    note
  });

  res.status(201).json(timetable);
});

export const updateTimetableNote = asyncHandler(async (req: Request, res: Response) => {
  const { note } = req.body;
  
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.json({ message: 'Note updated successfully (Demo Mode)', note });
  }

  const timetable = await Timetable.findById(req.params.id);

  if (timetable) {
    timetable.note = note;
    const updatedTimetable = await timetable.save();
    res.json(updatedTimetable);
  } else {
    res.status(404).json({ message: 'Timetable entry not found' });
  }
});
