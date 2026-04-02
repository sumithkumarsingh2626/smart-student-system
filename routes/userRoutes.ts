import express from 'express';
import { getUsers, getUserById, getUsersByRole } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('faculty', 'admin'), getUsers);
router.get('/role/:role', protect, authorize('faculty', 'admin'), getUsersByRole);
router.get('/:id', protect, getUserById);

export default router;
