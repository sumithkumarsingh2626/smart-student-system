export type DemoRole = 'student' | 'faculty' | 'admin';

export interface DemoUser {
  _id: string;
  role: DemoRole;
  name: string;
  email: string;
  password: string;
  aliases?: string[];
  passwordAliases?: string[];
  dept?: string;
  classId?: string;
  class?: string;
  roll?: string;
  loginId?: string;
  dob?: string;
}

export const demoUsers: DemoUser[] = [
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

export const demoUsersById = Object.fromEntries(
  demoUsers.map((user) => [user._id, user]),
) as Record<string, DemoUser>;

export const findDemoUser = ({
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
