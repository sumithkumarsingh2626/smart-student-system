import express from 'express';
import { getTimetableByClass, createTimetable, updateTimetableNote, getTimetableByFaculty } from '../controllers/timetableController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/:classId', protect, getTimetableByClass);
router.get('/faculty/:facultyId', protect, getTimetableByFaculty);
router.post('/', protect, authorize('faculty'), createTimetable);
router.put('/:id', protect, authorize('faculty'), updateTimetableNote);

export default router;
