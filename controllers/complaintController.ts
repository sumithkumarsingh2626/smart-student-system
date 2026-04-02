import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { Response } from 'express';

const demoComplaints: any[] = [];

const formatDemoComplaint = (req: any, body: any) => ({
  _id: `demo-complaint-${Date.now()}`,
  studentId: req.user?._id,
  studentName: req.user?.name || 'Student',
  roll: req.user?.roll || '',
  classId: req.user?.classId || '',
  category: body.category,
  subject: body.subject,
  description: body.description,
  status: 'Open',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createComplaint = asyncHandler(async (req: any, res: Response) => {
  const { category, subject, description } = req.body;

  if (!category || !subject?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Category, subject, and description are required' });
  }

  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user?._id)) {
    const complaint = formatDemoComplaint(req, {
      category,
      subject: subject.trim(),
      description: description.trim(),
    });
    demoComplaints.unshift(complaint);
    return res.status(201).json(complaint);
  }

  const complaint = await Complaint.create({
    studentId: req.user._id,
    studentName: req.user.name,
    roll: req.user.roll,
    classId: req.user.classId,
    category,
    subject: subject.trim(),
    description: description.trim(),
  });

  res.status(201).json(complaint);
});

export const getMyComplaints = asyncHandler(async (req: any, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user?._id)) {
    return res.json(demoComplaints.filter((complaint) => complaint.studentId === req.user?._id));
  }

  const complaints = await Complaint.find({ studentId: req.user._id }).sort({ createdAt: -1 });
  res.json(complaints);
});
