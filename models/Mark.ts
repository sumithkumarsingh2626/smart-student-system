import mongoose from 'mongoose';

const markSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  sgpa: { type: Number, required: true },
  cgpa: { type: Number, required: true },
  totalCredits: { type: Number, required: true },
  subjectsAppeared: { type: Number, required: true },
  subjectsPassed: { type: Number, required: true },
  collegeName: { type: String, required: true },
  collegeCode: { type: String, required: true },
  results: [{
    sno: { type: Number, required: true },
    courseName: { type: String, required: true },
    courseCode: { type: String, required: true },
    grade: { type: String, required: true },
    gradePoint: { type: Number, required: true },
    credits: { type: Number, required: true },
    status: { type: String, required: true }
  }]
}, { timestamps: true });

const Mark = mongoose.model('Mark', markSchema);
export default Mark;
