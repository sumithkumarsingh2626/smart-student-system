import Attendance from '../models/Attendance.js';
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';

export const markAttendance = asyncHandler(async (req: any, res: Response) => {
  const { classId, subjectId, date, records } = req.body;

  // --- DEMO FALLBACK ---
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user._id)) {
    return res.status(201).json({ message: 'Attendance marked successfully (Demo Mode)', date, records });
  }
  // --- END DEMO FALLBACK ---

  try {
    const attendance = await Attendance.create({
      classId,
      subjectId,
      facultyId: req.user._id,
      date: new Date(date),
      records
    });
    res.status(201).json(attendance);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Attendance already marked for this date and subject' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

export const getAttendanceByStudent = asyncHandler(async (req: Request, res: Response) => {
  // --- DEMO FALLBACK ---
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.json([]);
  }
  // --- END DEMO FALLBACK ---
  const attendance = await Attendance.find({ 'records.studentId': req.params.id }).populate('subjectId', 'name');
  res.json(attendance);
});

export const getAttendanceByClass = asyncHandler(async (req: Request, res: Response) => {
  // --- DEMO FALLBACK ---
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.classId)) {
    return res.json([]);
  }
  // --- END DEMO FALLBACK ---
  const attendance = await Attendance.find({ classId: req.params.classId }).populate('subjectId', 'name');
  res.json(attendance);
});
