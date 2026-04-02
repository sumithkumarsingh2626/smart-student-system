import Class from '../models/Class.js';
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';

const demoClasses = [
  { _id: '2-A', name: '2-A', section: 'A', year: '2nd' },
  { _id: '2-B', name: '2-B', section: 'B', year: '2nd' },
  { _id: '2-C', name: '2-C', section: 'C', year: '2nd' },
  { _id: '2-AIML', name: '2-AIML', section: 'AIML', year: '2nd' },
  { _id: '2-CS', name: '2-CS', section: 'CS', year: '2nd' }
];

export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json(demoClasses);
  }
  const classes = await Class.find({});
  res.json(classes);
});

export const getClassById = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    const demoClass = demoClasses.find(c => c._id === req.params.id);
    if (demoClass) {
      return res.json({ ...demoClass, students: [], faculty: [] });
    }
    return res.status(404).json({ message: 'Class not found' });
  }
  const classObj = await Class.findById(req.params.id).populate('students faculty', '-password');

  if (classObj) {
    res.json(classObj);
  } else {
    res.status(404).json({ message: 'Class not found' });
  }
});
