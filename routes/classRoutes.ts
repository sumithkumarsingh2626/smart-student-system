import express from 'express';
import { getClasses, getClassById } from '../controllers/classController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getClasses);
router.get('/:id', protect, getClassById);

export default router;
