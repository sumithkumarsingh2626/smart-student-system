import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 3-C
  department: { type: String, required: true },
  year: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);
export default Class;
