import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  classId: { type: mongoose.Schema.Types.Mixed, default: null },
  class: { type: String, trim: true },
  subjects: [{ type: mongoose.Schema.Types.Mixed }],
  dept: { type: String, trim: true },
  roll: { type: String, trim: true },
  dob: { type: String, trim: true },
  loginId: { type: String, trim: true },
  contact: { type: String, trim: true },
  phone: { type: String, trim: true },
  mobile: { type: String, trim: true },
  photo: { type: String, trim: true }
}, { timestamps: true });

userSchema.index({ role: 1, email: 1 });
userSchema.index({ role: 1, roll: 1 });
userSchema.index({ role: 1, loginId: 1 });

userSchema.pre('save', async function(this: any) {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
