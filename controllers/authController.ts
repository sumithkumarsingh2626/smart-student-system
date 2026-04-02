import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import { findDemoUser } from '../config/demoUsers.js';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d',
  });
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, classId, subjects } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    classId,
    subjects
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  const demoUser = findDemoUser({ identifier: email, password, role });
  if (demoUser) {
    return res.json({
      _id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      dept: demoUser.dept,
      classId: demoUser.classId,
      class: demoUser.class,
      roll: demoUser.roll,
      loginId: demoUser.loginId,
      dob: demoUser.dob,
      token: generateToken(demoUser._id),
    });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(401).json({ message: 'Invalid credentials for the selected role' });
  }

  const user: any = await User.findOne({ email, role });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
      classId: user.classId,
      roll: user.roll,
      dob: user.dob,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});
