import mongoose from 'mongoose';

const teachingNoteSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classLabel: { type: String, required: true },
  time: { type: String, required: true },
  note: { type: String, required: true }
}, { timestamps: true });

// Unique for faculty + class + time
teachingNoteSchema.index({ facultyId: 1, classLabel: 1, time: 1 }, { unique: true });

const TeachingNote = mongoose.model('TeachingNote', teachingNoteSchema);
export default TeachingNote;
