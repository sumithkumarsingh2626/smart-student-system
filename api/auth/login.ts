import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { findDemoUser } from '../../config/demoUsers';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d',
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, role } = req.body;

  console.log(`🔐 [API] Login attempt - Email: ${email}, Role: ${role}`);

  // Check demo users first (works even without DB)
  const demoUser = findDemoUser({ identifier: email, password, role });
  if (demoUser) {
    console.log(`✅ [API] Demo user found: ${demoUser.email}`);
    return res.status(200).json({
      _id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      dept: demoUser.dept,
      classId: demoUser.classId,
      class: demoUser.class,
      roll: demoUser.roll,
      loginId: demoUser.loginId,
      dob: demoUser.dob,
      token: generateToken(demoUser._id),
    });
  }

  console.log(`❌ [API] Invalid credentials for email: ${email}`);
  return res.status(401).json({ message: 'Invalid email or password' });
}
