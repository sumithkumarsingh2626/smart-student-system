import User from '../models/User.js';
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import { demoUsers, demoUsersById } from '../config/demoUsers.js';

const demoStudents = demoUsers
  .filter((user) => user.role === 'student')
  .map((student, index) => ({
    ...student,
    year: '3rd Year',
    department: student.dept,
    attendance: index === 0 ? 85 : 91,
    cgpa: index === 0 ? 8.5 : 9.1,
  }));

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json(demoStudents);
  }

  const search = req.query.search;
  let query = {};
  
  if (search) {
    query = { name: { $regex: search, $options: 'i' } };
  }

  const users = await User.find(query).select('-password');
  res.json(users);
});

export const getUsersByRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.params;

  if (mongoose.connection.readyState !== 1) {
    if (role === 'student') {
      return res.json(demoStudents);
    }
    return res.json([]);
  }

  const users = await User.find({ role }).select('-password');
  res.json(users);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    const user = demoStudents.find((student) =>
      student._id === req.params.id ||
      student.roll === req.params.id,
    );
    if (user) return res.json(user);

    if (demoUsersById[req.params.id]) {
      return res.json(demoUsersById[req.params.id]);
    }

    return res.status(404).json({ message: 'User not found (Demo Mode or Invalid ID)' });
  }

  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});
