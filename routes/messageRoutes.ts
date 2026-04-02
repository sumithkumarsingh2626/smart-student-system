import express from 'express';
import { createMessage, getMessagesByClass, getMessagesByFaculty } from '../controllers/messageController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('faculty'), createMessage);
router.get('/:classId', protect, getMessagesByClass);
router.get('/faculty/:facultyId', protect, getMessagesByFaculty);

export default router;
