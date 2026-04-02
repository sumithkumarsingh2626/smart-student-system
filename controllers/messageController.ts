import Message from '../models/Message.js';
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';

// Demo Data
const demoMessages = [
  {
    _id: 'demo-msg-1',
    senderName: 'Admin',
    content: 'Welcome to Smart Student Portal!',
    type: 'broadcast',
    classId: 'All',
    classes: ['All'],
    attachments: [],
    facultyId: { name: 'Admin' },
    createdAt: new Date()
  },
  {
    _id: 'demo-msg-2',
    senderName: 'Faculty',
    content: 'Assignment 1 is due tomorrow.',
    type: 'broadcast',
    classId: 'CS-A',
    classes: ['CS-A'],
    attachments: [],
    facultyId: { name: 'Faculty' },
    createdAt: new Date(Date.now() - 86400000)
  }
];

export const createMessage = asyncHandler(async (req: any, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user._id)) {
    const demoMessage = {
      ...req.body,
      _id: 'demo-' + Date.now(),
      senderName: req.body.senderName || req.user?.name || 'Faculty',
      classId: req.body.classId || req.body.classes?.[0] || 'All',
      classes: Array.isArray(req.body.classes) ? req.body.classes : [req.body.classId || 'All'],
      attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
      createdAt: new Date()
    };
    demoMessages.unshift(demoMessage);
    return res.status(201).json(demoMessage);
  }
  const { classId, type, content, mediaUrl } = req.body;

  const message = await Message.create({
    classId,
    facultyId: req.user._id,
    type,
    content,
    mediaUrl
  });

  res.status(201).json(message);
});

export const getMessagesByClass = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1 || (req.params.classId !== 'All' && !mongoose.Types.ObjectId.isValid(req.params.classId))) {
    return res.json(demoMessages.filter(m =>
      m.classId === req.params.classId ||
      m.classId === 'All' ||
      m.classes?.includes(req.params.classId) ||
      m.classes?.includes('All')
    ));
  }
  const messages = await Message.find({ classId: req.params.classId }).populate('facultyId', 'name').sort({ createdAt: -1 });
  res.json(messages);
});

export const getMessagesByFaculty = asyncHandler(async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.facultyId)) {
    return res.json(demoMessages);
  }
  const messages = await Message.find({ facultyId: req.params.facultyId }).populate('facultyId', 'name').sort({ createdAt: -1 });
  res.json(messages);
});
