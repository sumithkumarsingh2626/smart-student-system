import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const globalForMongoose = globalThis;
const mongooseCache = globalForMongoose.__smartStudentMongoCache || {
  conn: null,
  promise: null,
};
globalForMongoose.__smartStudentMongoCache = mongooseCache;

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
    aliases: ['JS2626', 'SJ2626', 'student_demo_123'],
    passwordAliases: ['2005-01-01'],
    dept: 'Computer Science',
    classId: '2-A',
    class: '2-A',
    roll: 'JS2626',
    dob: '2005-01-01',
  },
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findDemoUser = ({ identifier, password, role }) => {
  const normalizedIdentifier = identifier?.trim().toLowerCase();
  const normalizedPassword = password?.trim();

  if (!normalizedIdentifier || !normalizedPassword || !role) {
    return undefined;
  }

  return demoUsers.find((user) => {
    if (user.role !== role) {
      return false;
    }

    const identifiers = [user.email, ...(user.aliases ?? [])].map((value) =>
      value.toLowerCase(),
    );
    const passwords = [user.password, ...(user.passwordAliases ?? [])];

    return (
      identifiers.includes(normalizedIdentifier) &&
      passwords.includes(normalizedPassword)
    );
  });
};

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    classId: mongoose.Schema.Types.Mixed,
    class: String,
    subjects: [mongoose.Schema.Types.Mixed],
    dept: String,
    roll: String,
    dob: String,
    loginId: String,
    contact: String,
    phone: String,
    mobile: String,
    photo: String,
  },
  {
    collection: 'users',
    strict: false,
  },
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const connectToDatabase = async () => {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
  }

  mongooseCache.conn = await mongooseCache.promise;
  return mongooseCache.conn;
};

const buildIdentifierQuery = (identifier, role) => {
  const exactMatch = new RegExp(`^${escapeRegExp(identifier.trim())}$`, 'i');

  return {
    role,
    $or: [
      { email: exactMatch },
      { loginId: exactMatch },
      { roll: exactMatch },
    ],
  };
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d',
  });

const formatAuthUser = (user, token) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  dept: user.dept,
  classId: user.classId,
  class: user.class,
  roll: user.roll,
  loginId: user.loginId,
  dob: user.dob,
  subjects: user.subjects,
  contact: user.contact,
  phone: user.phone,
  mobile: user.mobile,
  photo: user.photo,
  token,
});

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization',
  );
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { email, password, role } = req.body || {};
  const identifier = email?.trim();
  const normalizedPassword = password?.trim();

  if (!identifier || !normalizedPassword || !role) {
    res.status(400).json({ message: 'Identifier, password, and role are required' });
    return;
  }

  let databaseError = null;

  try {
    await connectToDatabase();

    const user = await User.findOne(buildIdentifierQuery(identifier, role)).lean();

    if (user) {
      const passwordMatches = await bcrypt.compare(normalizedPassword, user.password || '');
      const dobMatches = role === 'student' && user.dob === normalizedPassword;

      if (passwordMatches || dobMatches) {
        res.status(200).json(formatAuthUser(user, generateToken(String(user._id))));
        return;
      }

      res.status(401).json({ message: 'Invalid email, ID, roll number, or password' });
      return;
    }
  } catch (error) {
    databaseError = error;
    console.error('[VERCEL API] MongoDB login error:', error);
  }

  const matchedUser = findDemoUser({
    identifier,
    password: normalizedPassword,
    role,
  });

  if (matchedUser) {
    res.status(200).json(formatAuthUser(matchedUser, generateToken(matchedUser._id)));
    return;
  }

  if (databaseError) {
    res.status(503).json({ message: 'Database login is not configured on the server' });
    return;
  }

  res.status(401).json({ message: 'Invalid credentials for the selected role' });
}
