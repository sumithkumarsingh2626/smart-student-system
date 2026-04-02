import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  day: { type: String, required: true }, // Monday, Tuesday, etc.
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  note: { type: String }
}, { timestamps: true });

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
