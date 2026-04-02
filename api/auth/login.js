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

export default function handler(req, res) {
  console.log('[VERCEL API] Handler invoked:', {
    method: req.method,
    url: req.url,
    path: req.path,
  });

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization',
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, role } = req.body || {};

  console.log('[VERCEL API] Login attempt:', { email, role });

  const matchedUser = findDemoUser({
    identifier: email,
    password,
    role,
  });

  if (!matchedUser) {
    console.log('[VERCEL API] Authentication failed');
    return res.status(401).json({ message: 'Invalid credentials for the selected role' });
  }

  console.log('[VERCEL API] Authentication successful for:', matchedUser.email);

  const token = Buffer.from(JSON.stringify({ id: matchedUser._id })).toString('base64');

  return res.status(200).json({
    _id: matchedUser._id,
    name: matchedUser.name,
    email: matchedUser.email,
    role: matchedUser.role,
    dept: matchedUser.dept,
    classId: matchedUser.classId,
    class: matchedUser.class,
    roll: matchedUser.roll,
    loginId: matchedUser.loginId,
    dob: matchedUser.dob,
    token,
  });
}
