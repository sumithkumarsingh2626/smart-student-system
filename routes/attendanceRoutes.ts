import express from 'express';
import { markAttendance, getAttendanceByStudent, getAttendanceByClass } from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('faculty'), markAttendance);
router.get('/student/:id', protect, getAttendanceByStudent);
router.get('/class/:classId', protect, authorize('faculty', 'admin'), getAttendanceByClass);

export default router;
