console.log('[VERCEL API] login.js handler file loaded');

module.exports = function handler(req, res) {
  console.log('[VERCEL] Handler invoked:', { method: req.method, url: req.url, path: req.path });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization'
  );

  if (req.method === 'OPTIONS') {
    console.log('[VERCEL] Responding to OPTIONS');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('[VERCEL] Invalid method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, role } = req.body || {};

  console.log(`🔐 [VERCEL API] Login attempt - Email: ${email}, Password: ${password}, Role: ${role}`);

  // Demo users
  const demoUsers = [
    {
      _id: 'demo_admin_id',
      role: 'admin',
      name: 'Admin User',
      email: 'sumithkumar2626@gmail.com',
      password: 'admin123',
      dept: 'Administration',
      loginId: 'SJ2626',
    },
    {
      _id: 'demo_faculty_id',
      role: 'faculty',
      name: 'sumith kumar singh',
      email: 'faculty@demo.com',
      password: 'faculty123',
      dept: 'Computer Science',
      loginId: 'SJ2626',
    },
    {
      _id: 'demo_student_id',
      role: 'student',
      name: 'shumee',
      email: 'student@demo.com',
      password: '2626',
      dept: 'Computer Science',
      classId: '2-A',
      class: '2-A',
      roll: 'CS2626',
      dob: '2005-01-01',
    },
  ];

  // Normalize inputs
  const normalizedEmail = email?.trim().toLowerCase() || '';
  const normalizedPassword = password?.trim() || '';

  console.log(`📍 Normalized credentials - Email: "${normalizedEmail}", Password: "${normalizedPassword}"`);

  // Find matching user
  let matchedUser = null;

  for (const user of demoUsers) {
    console.log(`🔍 Checking role ${user.role} user: ${user.email}`);

    // Check role
    if (user.role !== role) {
      console.log(`  ❌ Role mismatch (${role} !== ${user.role})`);
      continue;
    }

    // For faculty/admin: match by email
    if (user.role !== 'student') {
      const emailLower = user.email.toLowerCase();
      const passwordMatch = user.password === normalizedPassword;
      const emailMatch = emailLower === normalizedEmail || emailLower.includes(normalizedEmail);

      console.log(`  📊 Admin/Faculty check - Email match: ${emailMatch}, Password match: ${passwordMatch}`);

      if (emailMatch && passwordMatch) {
        matchedUser = user;
        console.log(`  ✅ Found admin/faculty user!`);
        break;
      }
    } else {
      // For student: match by roll number (stored in aliases)
      const userIdentifiers = [user.email.toLowerCase(), user.roll?.toLowerCase(), 'cs2626', 'sj2626'];
      const itemMatch = userIdentifiers.includes(normalizedEmail);
      const passwordMatches = [user.password, user.dob].includes(normalizedPassword);

      console.log(`  📊 Student check - Identifier match: ${itemMatch}, Password match: ${passwordMatches}`);
      console.log(`    Available identifiers: ${userIdentifiers.join(', ')}`);
      console.log(`    Available passwords: ${[user.password, user.dob].join(', ')}`);

      if (itemMatch && passwordMatches) {
        matchedUser = user;
        console.log(`  ✅ Found student user!`);
        break;
      }
    }
  }

  if (matchedUser) {
    console.log(`✅ [API] Authentication successful for: ${matchedUser.email}`);
    
    // Generate token (simple JWT-like token)
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
      token: token,
    });
  }

  console.log(`❌ [API] Authentication failed - No matching user found`);
  return res.status(401).json({ message: 'Invalid email/roll number or password' });
}
