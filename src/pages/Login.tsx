import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, LogIn, Mail, ShieldCheck, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const roleTabs: Array<'student' | 'faculty' | 'admin'> = ['student', 'faculty', 'admin'];

const details = [
  {
    title: 'Organized workflows',
    copy: 'Attendance, marks, timetables, and messaging in one calm workspace.',
  },
  {
    title: 'Role-based access',
    copy: 'Students, faculty, and administrators each get a focused experience.',
  },
  {
    title: 'Reliable routines',
    copy: 'Clean layouts and predictable actions keep daily tasks simple.',
  },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState<'faculty' | 'student' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotMsg, setShowForgotMsg] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'student') {
        await login(rollNumber, dob, role);
        navigate('/student');
      } else {
        await login(email, password, role);
        navigate(role === 'admin' ? '/admin' : '/faculty');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="hidden lg:block"
        >
          <div className="px-4 xl:px-8">
            <div className="hero-badge mb-6">
              <ShieldCheck className="h-3.5 w-3.5" />
              Smart Student Management
            </div>
            <h1 className="page-title max-w-xl text-zinc-50">
              A clear, focused workspace for campus operations.
            </h1>
            <p className="page-subtitle mt-5">
              Manage student life, teaching workflows, and administration with a calmer interface
              that keeps the important things easy to find.
            </p>

            <div className="mt-10 space-y-3">
              {details.map((item) => (
                <div key={item.title} className="section-shell rounded-[18px] px-5 py-4">
                  <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-400">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="surface-panel mx-auto w-full max-w-xl rounded-[24px] p-6 sm:p-8 lg:p-10"
        >
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/8 bg-white/[0.03]">
              <GraduationCap className="h-6 w-6 text-zinc-100" />
            </div>
            <div className="hero-badge mb-4">Sign In</div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-zinc-50 sm:text-[2.35rem]">
              Welcome back
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
              Continue to your dashboard to review academics, communication, and daily updates.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-2 rounded-[16px] border border-white/8 bg-white/[0.02] p-1">
            {roleTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRole(tab)}
                className={cn(
                  'rounded-[12px] px-4 py-3 text-sm font-medium capitalize transition-all',
                  role === tab
                    ? 'bg-zinc-100 text-zinc-950 shadow-[0_8px_20px_rgba(0,0,0,0.18)]'
                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-100',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {role === 'student' ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Roll Number
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full rounded-[14px] border border-white/8 bg-white/[0.03] py-3.5 pl-12 pr-4"
                      placeholder="Roll Number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Password / DOB
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-[14px] border border-white/8 bg-white/[0.03] py-3.5 pl-12 pr-4"
                      placeholder="DOB or demo password"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {role === 'admin' ? 'Admin ID' : 'Faculty ID / Email'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-[14px] border border-white/8 bg-white/[0.03] py-3.5 pl-12 pr-4"
                      placeholder={role === 'admin' ? 'Admin ID' : 'Faculty ID or Email'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-[14px] border border-white/8 bg-white/[0.03] py-3.5 pl-12 pr-4"
                      placeholder="Password"
                    />
                  </div>
                </div>
              </>
            )}

            <p className="rounded-[14px] border border-white/6 bg-white/[0.02] px-4 py-3 text-[11px] leading-5 text-zinc-500">
              {role === 'student'
                ? 'Demo student: roll CS2626 and password 2626 or DOB 2005-01-01.'
                : role === 'faculty'
                  ? 'Demo faculty: faculty@demo.com or SJ2626 with password faculty123.'
                  : 'Demo admin: sumithkumar2626@gmail.com or SJ2626 with password admin123.'}
            </p>

            {error && (
              <p className="rounded-[12px] border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            )}

            {showForgotMsg && (
              <p className="rounded-[14px] border border-white/6 bg-white/[0.02] p-3 text-center text-[11px] text-zinc-400">
                Please contact the administration office to reset your login credentials.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="premium-button flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>

            {role === 'student' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotMsg(true)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-200"
                >
                  Forgotten Password?
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
