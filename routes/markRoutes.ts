import express from 'express';
import { protect, facultyOnly } from '../middleware/auth.js';
import Mark from '../models/Mark.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get marks for a student
router.get('/student/:studentId', protect, async (req, res) => {
  // --- DEMO FALLBACK ---
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.studentId)) {
    return res.json([{
      id: 'demo_mark_1',
      studentId: req.params.studentId,
      studentName: 'John Doe',
      roll: 'CS2626',
      class: '2-A',
      semester: '3-1',
      sgpa: 8.5,
      cgpa: 8.2,
      totalCredits: 24,
      subjectsAppeared: 6,
      subjectsPassed: 6,
      collegeName: 'Jenix Institute of Technology',
      collegeCode: 'JIT',
      subjects: [
        { name: 'Data Structures', code: 'CS301', grade: 'A', points: 9, credits: 4, status: 'P' },
        { name: 'Algorithms', code: 'CS302', grade: 'B', points: 8, credits: 4, status: 'P' },
        { name: 'Operating Systems', code: 'CS303', grade: 'A+', points: 10, credits: 4, status: 'P' },
        { name: 'Computer Networks', code: 'CS304', grade: 'B+', points: 8, credits: 4, status: 'P' },
        { name: 'Database Systems', code: 'CS305', grade: 'A', points: 9, credits: 4, status: 'P' },
        { name: 'Software Engineering', code: 'CS306', grade: 'A', points: 9, credits: 4, status: 'P' }
      ]
    }, {
      id: 'demo_mark_2',
      studentId: req.params.studentId,
      studentName: 'John Doe',
      roll: 'CS2626',
      class: '2-A',
      semester: '2-2',
      sgpa: 8.2,
      cgpa: 8.0,
      totalCredits: 24,
      subjectsAppeared: 6,
      subjectsPassed: 6,
      collegeName: 'Jenix Institute of Technology',
      collegeCode: 'JIT',
      subjects: [
        { name: 'Discrete Math', code: 'MA201', grade: 'B', points: 7, credits: 4, status: 'P' },
        { name: 'Digital Logic', code: 'CS201', grade: 'A', points: 9, credits: 4, status: 'P' }
      ]
    }]);
  }
  // --- END DEMO FALLBACK ---
  try {
    const marks = await Mark.find({ studentId: req.params.studentId });
    res.json(marks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update marks
router.post('/', protect, facultyOnly, async (req: any, res) => {
  // --- DEMO FALLBACK ---
  if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user._id)) {
    return res.status(201).json({ message: 'Marks saved successfully (Demo Mode)', ...req.body });
  }
  // --- END DEMO FALLBACK ---
  try {
    const mark = await Mark.create({ ...req.body });
    res.status(201).json(mark);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
