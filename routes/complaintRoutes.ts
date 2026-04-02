import express from 'express';
import { createComplaint, getMyComplaints } from '../controllers/complaintController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/mine', protect, authorize('student'), getMyComplaints);
router.post('/', protect, authorize('student'), createComplaint);

export default router;
