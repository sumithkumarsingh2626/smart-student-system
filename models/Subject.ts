import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true }
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
