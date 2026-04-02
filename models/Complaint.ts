import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    roll: { type: String },
    classId: { type: String },
    category: {
      type: String,
      enum: ['Academic', 'Attendance', 'Fees', 'Hostel', 'Technical', 'Other'],
      default: 'Other',
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['Open', 'In Review', 'Resolved'],
      default: 'Open',
    },
  },
  { timestamps: true },
);

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
