import Timetable from '../models/Timetable.js';
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';

// Demo Data
const demoTimetable = {
  schedule: {
    'Monday': [
      { time: '09:10-10:00', label: 'Data Structures', class: '2-A', room: '301' },
      { time: '10:00-10:50', label: 'Algorithms', class: '2-A', room: '302' },
      { time: '10:50-11:40', label: 'FREE', room: '-' },
      { time: '11:40-12:30', label: 'Operating Systems', class: '2-A', room: '301' },
      { time: '12:30-01:10', label: 'LUNCH', room: '-' },
      { time: '01:10-02:00', label: 'Database Systems', class: '2-A', room: '301' },
      { time: '02:00-02:50', label: 'FREE', room: '-' },
      { time: '02:50-03:40', label: 'Computer Networks', class: '2-A', room: '304' },
      { time: '03:40-04:30', label: 'FREE', room: '-' }
    ],
    'Tuesday': [
      { time: '09:10-10:00', label: 'FREE', room: '-' },
      { time: '10:00-10:50', label: 'Operating Systems', class: '2-A', room: '301' },
      { time: '10:50-11:40', label: 'FREE', room: '-' },
      { time: '11:40-12:30', label: 'Software Engineering', class: '2-A', room: '302' },
      { time: '12:30-01:10', label: 'LUNCH', room: '-' },
      { time: '01:10-02:00', label: 'FREE', room: '-' },
      { time: '02:00-02:50', label: 'Web Development', class: '2-A', room: '301' },
      { time: '02:50-03:40', label: 'FREE', room: '-' },
      { time: '03:40-04:30', label: 'FREE', room: '-' }
    ],
    'Wednesday': [
      { time: '09:10-10:00', label: 'Database Systems', class: '2-A', room: '301' },
      { time: '10:00-10:50', label: 'FREE', room: '-' },
      { time: '10:50-11:40', label: 'FREE', room: '-' },
      { time: '11:40-12:30', label: 'FREE', room: '-' },
      { time: '12:30-01:10', label: 'LUNCH', room: '-' },
      { time: '01:10-02:00', label: 'FREE', room: '-' },
      { time: '02:00-02:50', label: 'Computer Networks', class: '2-A', room: '304' },
      { time: '02:50-03:40', label: 'FREE', room: '-' },
      { time: '03:40-04:30', label: 'FREE', room: '-' }
    ],
    'Thursday': [
      { time: '09:10-10:00', label: 'FREE', room: '-' },
      { time: '10:00-10:50', label: 'FREE', room: '-' },
      { time: '10:50-11:40', label: 'FREE', room: '-' },
      { time: '11:40-12:30', label: 'Software Engineering', class: '2-A', room: '302' },
      { time: '12:30-01:10', label: 'LUNCH', room: '-' },
      { time: '01:10-02:00', label: 'FREE', room: '-' },
      { time: '02:00-02:50', label: 'FREE', room: '-' },
      { time: '02:50-03:40', label: 'FREE', room: '-' },
      { time: '03:40-04:30', label: 'FREE', room: '-' }
    ],
    'Friday': [
      { time: '09:10-10:00', label: 'FREE', room: '-' },
      { time: '10:00-10:50', label: 'Web Development', class: '2-A', room: '301' },
      { time: '10:50-11:40', label: 'FREE', room: '-' },
      { time: '11:40-12:30', label: 'FREE', room: '-' },
      { time: '12:30-01:10', label: 'LUNCH', room: '-' },
      { time: '01:10-02:00', label: 'FREE', room: '-' },
      { time: '02:00-02:50', label: 'FREE', room: '-' },
      { time: '02:50-03:40', label: 'FREE', room: '-' },
      { time: '03:40-04:30', label: 'FREE', room: '-' }
    ],
    'Saturday': [
      { time: '09:10-10:00', label: 'FREE', room: '-' },
      { time: '10:00-10:50', label: 'FREE', room: '-' },
      { time: '10:50-11:40', label: 'FREE', room: '-' },
      { time: '11:40-12:30', label: 'FREE', room: '-' },
      { time: '12:30-01:10', label: 'LUNCH', room: '-' },
      { time: '01:10-02:00', label: 'FREE', room: '-' },
      { time: '02:00-02:50', label: 'FREE', room: '-' },
      { time: '02:50-03:40', label: 'FREE', room: '-' },
      { time: '03:40-04:30', label: 'FREE', room: '-' }
    ]
  }
};

export const getTimetableByClass = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.classId)) {
    return res.json(demoTimetable);
  }
  const timetable = await Timetable.find({ classId: req.params.classId }).populate('subjectId facultyId', 'name');
  res.json(timetable);
});

export const getTimetableByFaculty = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.facultyId)) {
    return res.json(demoTimetable);
  }
  const timetable = await Timetable.find({ facultyId: req.params.facultyId }).populate('subjectId classId', 'name');
  
  // Transform to the format expected by frontend if needed
  // For now, let's just return the documents or a structured object
  // The frontend expects { schedule: { Day: [...] } }
  
  const schedule: any = {
    'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': []
  };

  timetable.forEach((entry: any) => {
    if (schedule[entry.day]) {
      schedule[entry.day].push({
        _id: entry._id,
        time: `${entry.startTime} - ${entry.endTime}`,
        subject: entry.subjectId?.name || 'Unknown',
        class: entry.classId?.name || 'Unknown',
        room: 'TBD',
        note: entry.note
      });
    }
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
