import express from 'express';
import { protect, facultyOnly } from '../middleware/auth.js';
import TeachingNote from '../models/TeachingNote.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get note for a class session
router.get('/:classLabel/:time', protect, async (req: any, res) => {
  // --- DEMO FALLBACK ---
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user._id)) {
    return res.json(null);
  }
  // --- END DEMO FALLBACK ---
  try {
    const note = await TeachingNote.findOne({
      facultyId: req.user._id,
      classLabel: req.params.classLabel,
      time: req.params.time
    });
    res.json(note);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update note
router.post('/', protect, facultyOnly, async (req: any, res) => {
  // --- DEMO FALLBACK ---
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user._id)) {
    return res.json({ message: 'Note saved successfully (Demo Mode)', ...req.body });
  }
  // --- END DEMO FALLBACK ---
  const { classLabel, time, note } = req.body;
  try {
    const teachingNote = await TeachingNote.findOneAndUpdate(
      { facultyId: req.user._id, classLabel, time },
      { note },
      { new: true, upsert: true }
    );
    res.json(teachingNote);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
