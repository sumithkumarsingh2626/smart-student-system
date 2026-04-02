import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image', 'audio'], default: 'text' },
  content: { type: String, required: true },
  mediaUrl: { type: String }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
