import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d',
  });
};

// Demo users - hardcoded for Vercel deployment
const demoUsers = [
  {
    _id: 'demo_admin_id',
    role: 'admin',
    name: 'Admin User',
    email: 'sumithkumar2626@gmail.com',
    password: 'admin123',
    aliases: ['SJ2626', 'ADMIN001'],
    dept: 'Administration',
    loginId: 'SJ2626',
  },
  {
    _id: 'demo_faculty_id',
    role: 'faculty',
    name: 'sumith kumar singh',
    email: 'faculty@demo.com',
    password: 'faculty123',
    aliases: ['SJ2626', 'FACULTY001', 'faculty_demo_123'],
    dept: 'Computer Science',
    loginId: 'SJ2626',
  },
  {
    _id: 'demo_student_id',
    role: 'student',
    name: 'shumee',
    email: 'student@demo.com',
    password: '2626',
    aliases: ['CS2626', 'SJ2626', 'student_demo_123'],
    passwordAliases: ['2005-01-01'],
    dept: 'Computer Science',
    classId: '2-A',
    class: '2-A',
    roll: 'CS2626',
    dob: '2005-01-01',
  },
];

const findDemoUser = ({
  identifier,
  password,
  role,
}: {
  identifier?: string;
  password?: string;
  role?: string;
}) => {
  const normalizedIdentifier = identifier?.trim().toLowerCase();
  const normalizedPassword = password?.trim();

  if (!normalizedIdentifier || !normalizedPassword || !role) {
    console.log('❌ Missing credentials:', { identifier, password, role });
    return undefined;
  }

  return demoUsers.find((user) => {
    if (user.role !== role) {
      console.log(`❌ Role mismatch: expected ${role}, got ${user.role}`);
      return false;
    }

    const identifiers = [user.email, ...(user.aliases ?? [])].map((value) =>
      value.toLowerCase(),
    );
    const passwords = [user.password, ...(user.passwordAliases ?? [])];

    const identifierMatch = identifiers.includes(normalizedIdentifier);
    const passwordMatch = passwords.includes(normalizedPassword);

    console.log(`🔍 Checking ${user.email}:`, {
      identifierMatch,
      passwordMatch,
      availableIdentifiers: identifiers,
      availablePasswords: passwords,
    });

    return identifierMatch && passwordMatch;
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

