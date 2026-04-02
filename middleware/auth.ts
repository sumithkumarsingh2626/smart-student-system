import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { demoUsersById } from '../config/demoUsers.js';

export const protect = async (req: any, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');

      if (demoUsersById[decoded.id]) {
        req.user = demoUsersById[decoded.id];
        return next();
      }

      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(decoded.id)) {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({ message: 'User not found' });
        }
      } else {
        // If DB is not connected and it's not a demo ID, we can't authorize
        return res.status(401).json({ message: 'Not authorized, database not connected or invalid ID' });
      }
      
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

export const facultyOnly = (req: any, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'faculty' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as faculty' });
  }
};

export const adminOnly = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};
