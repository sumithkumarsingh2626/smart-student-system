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

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildIdentifierQuery = (identifier: string, role: string) => {
  const normalizedIdentifier = identifier.trim();
  const exactMatch = new RegExp(`^${escapeRegExp(normalizedIdentifier)}$`, 'i');

  return {
    role,
    $or: [
      { email: exactMatch },
      { loginId: exactMatch },
      { roll: exactMatch },
    ],
  };
};

const formatAuthUser = (user: any, token: string) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  dept: user.dept,
  classId: user.classId,
  class: user.class,
  roll: user.roll,
  loginId: user.loginId,
  dob: user.dob,
  subjects: user.subjects,
  contact: user.contact,
  phone: user.phone,
  mobile: user.mobile,
  photo: user.photo,
  token,
});

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    role,
    classId,
    class: className,
    subjects,
    dept,
    roll,
    dob,
    loginId,
    contact,
    phone,
    mobile,
    photo,
  } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password || !role || !name) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    classId,
    class: className || classId,
    subjects,
    dept,
    roll,
    dob,
    loginId,
    contact,
    phone,
    mobile,
    photo,
  });

  if (user) {
    res.status(201).json(formatAuthUser(user, generateToken(user._id.toString())));
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const identifier = email?.trim();
  const normalizedPassword = password?.trim();

  console.log(`Login attempt - Identifier: ${identifier}, Role: ${role}`);

  if (!identifier || !normalizedPassword || !role) {
    return res.status(400).json({ message: 'Identifier, password, and role are required' });
  }

  if (mongoose.connection.readyState === 1) {
    const user: any = await User.findOne(buildIdentifierQuery(identifier, role));

    if (user) {
      const passwordMatches = await user.matchPassword(normalizedPassword);
      const dobMatches = role === 'student' && user.dob === normalizedPassword;

      if (passwordMatches || dobMatches) {
        console.log(`MongoDB user authenticated: ${user.email}`);
        return res.json(formatAuthUser(user, generateToken(user._id.toString())));
      }

      console.log(`Invalid password for identifier: ${identifier}`);
      return res.status(401).json({ message: 'Invalid email, ID, roll number, or password' });
    }
  }

  console.log(`Database connection state: ${mongoose.connection.readyState}`);

  const demoUser = findDemoUser({ identifier, password: normalizedPassword, role });
  if (demoUser) {
    console.log(`Demo user authenticated: ${demoUser.email}`);
    return res.json(formatAuthUser(demoUser, generateToken(demoUser._id)));
  }

  console.log(`No user found for identifier: ${identifier}`);
  res.status(401).json({ message: 'Invalid credentials for the selected role' });
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});
