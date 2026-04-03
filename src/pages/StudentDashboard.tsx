import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, MessageSquare, User as UserIcon, Settings, LogOut,
  Calendar as CalendarIcon, ChevronRight, ChevronLeft, DollarSign,
  BookOpen, Mail, Phone, MapPin, GraduationCap, FileText, Bell, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, startOfWeek, endOfWeek 
} from 'date-fns';
import { io } from 'socket.io-client';
import ComplaintCenter from '../components/ComplaintCenter';

const socket = io(window.location.origin);

const normalizeStudentMessages = (data: any) =>
  Array.isArray(data)
    ? data.map((message: any) => ({
        ...message,
        senderName: message?.senderName || message?.facultyId?.name || 'Faculty',
        attachments: Array.isArray(message?.attachments) ? message.attachments : [],
      }))
    : [];

const formatMessageTimestamp = (value: any) => {
  try {
    if (value?.toDate) {
      return format(value.toDate(), 'MMM d, h:mm a');
    }

    if (value) {
      return format(new Date(value), 'MMM d, h:mm a');
    }
  } catch {
    // Fall through to fallback label.
  }

  return 'Just now';
};

const isFreeTimetableEntry = (value: string | undefined) => {
  const normalized = (value || '').trim().toUpperCase();
  return !normalized || normalized === 'FREE' || normalized === '--';
};

// --- Sub-Components ---

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: UserIcon, label: 'Profile', path: '/student/profile' },
    { icon: CalendarIcon, label: 'Timetable', path: '/student/timetable' },
    { icon: CheckCircle, label: 'Attendance', path: '/student' },
    { icon: FileText, label: 'Marks', path: '/student/marks' },
    { icon: MessageSquare, label: 'Message', path: '/student/messages' },
    { icon: Settings, label: 'Settings', path: '/student/settings' },
  ];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 ease-in-out lg:w-[288px]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full p-4 lg:p-5">
          <div className="surface-panel flex h-full flex-col rounded-[20px] px-4 py-5">
            <div className="mb-7 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/8 bg-white/[0.03]">
                  <GraduationCap className="h-5 w-5 text-zinc-100" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em] text-zinc-50">Smart Student</p>
                  <p className="text-xs text-zinc-500">Student dashboard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="soft-button flex h-10 w-10 items-center justify-center rounded-[14px] lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  data-active={location.pathname === item.path}
                  className={cn(
                    "nav-pill flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium transition-all",
                    location.pathname === item.path 
                      ? "bg-white/[0.05] pl-5 text-zinc-50"
                      : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-100"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="nav-pill mt-3 flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-sm font-medium text-red-200 transition-all hover:bg-red-500/10 hover:text-red-100"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Logout
            </button>

            <div className="mt-auto section-shell rounded-[18px] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/8 bg-white/[0.03]">
                  {profile?.photo ? (
                    <img
                      src={profile.photo}
                      alt={profile?.name || 'Student profile'}
                      className="h-full w-full rounded-[14px] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="h-[18px] w-[18px] text-zinc-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">{profile?.name || 'Student'}</p>
                  <p className="truncate text-xs text-zinc-500">{profile?.roll || 'Profile ready'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// --- Attendance Module ---

const Attendance = () => {
  const [view, setView] = useState<'subjects' | 'months' | 'calendar' | 'summary'>('summary');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [period, setPeriod] = useState<'semester' | 'month'>('semester');
  const { user } = useAuth();

  const subjects = ['CN', 'AI', 'SPM', 'CNS'];
  const months = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1));

  useEffect(() => {
    if (!user) return;
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`/api/attendance/student/${user.id}`);
        setAllAttendance(res.data);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };
    fetchAttendance();
  }, [user]);

  useEffect(() => {
    if (!user || view !== 'calendar' || !selectedSubject) return;
    const fetchSubjectAttendance = async () => {
      try {
        const res = await axios.get(`/api/attendance/student/${user.id}`);
        const filtered = res.data.filter((a: any) => a.subject === selectedSubject);
        setAttendanceData(filtered);
      } catch (error) {
        console.error('Error fetching subject attendance:', error);
      }
    };
    fetchSubjectAttendance();
  }, [user, view, selectedSubject]);

  const calculateStats = () => {
    const stats: any = {};
    subjects.forEach(sub => {
      const subData = allAttendance.filter(a => {
        const matchesSubject = a.subject === sub;
        if (!matchesSubject) return false;
        
        if (period === 'month') {
          const date = new Date(a.date);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        return true; // Semester (all data for now)
      });

      const total = subData.length;
      const present = subData.filter(a => a.status === 'P').length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      stats[sub] = { total, present, percentage };
    });
    return stats;
  };

  const renderSummary = () => {
    const stats = calculateStats();
    return (
      <div className="space-y-8">
        <div className="flex gap-2 p-1 bg-zinc-800 rounded-2xl w-fit">
          <button
            onClick={() => setPeriod('semester')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-medium transition-all",
              period === 'semester' ? "bg-zinc-100 text-zinc-950 shadow-lg" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Current Semester
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-medium transition-all",
              period === 'month' ? "bg-zinc-100 text-zinc-950 shadow-lg" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Last Month
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {subjects.map((sub, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={sub}
              className="p-5 sm:p-6 lg:p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-zinc-400" />
                  </div>
                  <span className={cn(
                    "text-2xl font-bold",
                    stats[sub].percentage >= 75 ? "text-green-500" : "text-red-500"
                  )}>
                    {stats[sub].percentage}%
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{sub}</h3>
                <div className="flex justify-between text-xs text-zinc-500 mb-4">
                  <span>Present: {stats[sub].present}</span>
                  <span>Total: {stats[sub].total}</span>
                </div>

                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats[sub].percentage}%` }}
                    className={cn(
                      "h-full transition-all duration-1000",
                      stats[sub].percentage >= 75 ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-8 border-t border-zinc-800">
          <button 
            onClick={() => setView('subjects')}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-all group"
          >
            Detailed History <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  };

  const renderSubjects = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {subjects.map((sub, idx) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          key={sub}
          onClick={() => { setSelectedSubject(sub); setView('months'); }}
          className="p-5 sm:p-6 lg:p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-zinc-700 cursor-pointer transition-all group shadow-xl"
        >
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-zinc-100 group-hover:text-zinc-950 transition-all">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-2">{sub}</h3>
          <p className="text-zinc-500 text-sm">View attendance history</p>
        </motion.div>
      ))}
    </div>
  );

  const renderMonths = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {months.map((month, idx) => (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          key={month.getTime()}
          onClick={() => { setSelectedMonth(month); setView('calendar'); }}
          className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-100 font-semibold hover:bg-zinc-800 transition-all"
        >
          {format(month, 'MMMM')}
        </motion.button>
      ))}
    </div>
  );

  const renderCalendar = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: startOfWeek(start), end: endOfWeek(end) });

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <h3 className="text-2xl font-bold text-zinc-100">{format(selectedMonth, 'MMMM yyyy')}</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-zinc-500">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-xs text-zinc-500">Absent</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-zinc-600 uppercase tracking-widest py-2">{d}</div>
          ))}
          {days.map(day => {
            const record = attendanceData.find(r => r.date === format(day, 'yyyy-MM-dd'));
            const isCurrentMonth = isSameMonth(day, selectedMonth);
            
            return (
              <div
                key={day.getTime()}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all",
                  !isCurrentMonth ? "opacity-20 border-transparent" : "border-zinc-800",
                  record?.status === 'P' ? "bg-green-500/10 border-green-500/50" : 
                  record?.status === 'A' ? "bg-red-500/10 border-red-500/50" : "bg-zinc-800/30"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  record?.status === 'P' ? "text-green-500" : 
                  record?.status === 'A' ? "text-red-500" : "text-zinc-500"
                )}>
                  {format(day, 'd')}
                </span>
                {record && (
                  <div className={cn(
                    "absolute bottom-1 w-1 h-1 rounded-full",
                    record.status === 'P' ? "bg-green-500" : "bg-red-500"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page dashboard-page--wide">
      <div className="dashboard-header mb-6 sm:mb-8">
        {view !== 'summary' && (
          <button 
            onClick={() => setView(view === 'calendar' ? 'months' : view === 'months' ? 'subjects' : 'summary')}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-1">Attendance</h1>
          <p className="text-zinc-500">
            {view === 'summary' ? 'Overview of your attendance' :
             view === 'subjects' ? 'Select a subject to view attendance' : 
             view === 'months' ? `Attendance for ${selectedSubject}` : 
             `${selectedSubject} • ${format(selectedMonth, 'MMMM')}`}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'summary' ? renderSummary() :
           view === 'subjects' ? renderSubjects() : 
           view === 'months' ? renderMonths() : renderCalendar()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- Messages Module ---

const Messages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.classId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }
    
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await axios.get(`/api/messages/${profile.classId}`);
        setMessages(normalizeStudentMessages(res.data));
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();

    // Join room for the student's class
    socket.emit('join_room', profile.classId);

    const handleReceiveMessage = (data: any) => {
      const [incomingMessage] = normalizeStudentMessages([data]);
      if (!incomingMessage) return;

      if (data.classId === profile.classId || data.classes?.includes('All') || data.classes?.includes(profile.classId)) {
        setMessages(prev => [incomingMessage, ...(Array.isArray(prev) ? prev : [])]);
        
        // Show pop-up notification
        toast.custom((t) => (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl flex items-start gap-4 max-w-sm">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 shrink-0">
              <Bell className="w-5 h-5 text-zinc-100" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">New Message from {incomingMessage.senderName}</p>
              <p className="text-sm text-zinc-100 line-clamp-2">{incomingMessage.content}</p>
            </div>
          </div>
        ), { duration: 5000 });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [profile]);

  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="dashboard-page dashboard-page--medium">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Messages</h1>
        <p className="text-zinc-500">Updates and announcements from your faculty</p>
      </div>

      <div className="space-y-4">
        {messagesLoading ? (
          <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
            <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4 animate-pulse" />
            <p className="text-zinc-500">Loading messages...</p>
          </div>
        ) : safeMessages.length > 0 ? safeMessages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={msg._id || msg.id || `${msg.content}-${idx}`}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                  <UserIcon className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-100">{msg.senderName}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Faculty</p>
                </div>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">
                {formatMessageTimestamp(msg.createdAt)}
              </span>
            </div>
            <p className="text-zinc-300 leading-relaxed mb-6">{msg.content}</p>
            {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
                {msg.attachments.map((att: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-xl text-xs text-zinc-400 border border-zinc-700">
                    <FileText className="w-4 h-4" />
                    <span>{att.name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )) : (
          <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
            <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No messages yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Timetable Module ---

const Timetable = () => {
  const { profile } = useAuth();
  const [timetable, setTimetable] = useState<any>(null);
  const [subjectAllocations, setSubjectAllocations] = useState<any[]>([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:10-10:00', '10:00-10:50', '10:50-11:40', '11:40-12:30', 
    '12:30-01:10', '01:10-02:00', '02:00-02:50', '02:50-03:40', '03:40-04:30'
  ];

  useEffect(() => {
    if (!profile?.classId) return;
    
    const fetchTimetable = async () => {
      try {
        const res = await axios.get(`/api/timetable/${profile.classId}`);
        if (res.data && res.data.schedule) {
          setTimetable(res.data.schedule);
          setSubjectAllocations(Array.isArray(res.data.subjectAllocations) ? res.data.subjectAllocations : []);
        } else {
          setTimetable(null);
          setSubjectAllocations([]);
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
        setTimetable(null);
        setSubjectAllocations([]);
      }
    };
    fetchTimetable();
  }, [profile]);

  const classLabel = profile?.class || profile?.classId || 'your class';

  return (
    <div className="dashboard-page dashboard-page--wide">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Class Timetable</h1>
        <p className="text-zinc-500">Weekly schedule for class {classLabel}</p>
      </div>

      <div className="dashboard-table-shell rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <table className="dashboard-table w-full border-collapse">
          <thead>
            <tr className="bg-zinc-800/50">
              <th className="p-4 border-b border-r border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest w-32">
                Day / Time
              </th>
              {timeSlots.map(slot => (
                <th key={slot} className="p-4 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {slot}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="border-b border-zinc-800 last:border-0">
                <td className="p-4 border-r border-zinc-800 bg-zinc-800/20 text-sm font-bold text-zinc-300">
                  {day}
                </td>
                {timeSlots.map((slot, i) => {
                  const data = timetable?.[day]?.find((s: any) => s.time === slot);
                  const isLunch = slot === '12:30-01:10';
                  const isFree = isFreeTimetableEntry(data?.subject);
                  
                  return (
                    <td key={i} className={cn(
                      "p-4 text-center transition-all min-w-[120px]",
                      isLunch ? "bg-zinc-800/40" : "hover:bg-zinc-800/30"
                    )}>
                      {isLunch ? (
                        <div className="text-[10px] text-center text-zinc-600 font-bold uppercase italic">Lunch</div>
                      ) : data ? (
                        <div className="space-y-1">
                          <p className={cn(
                            "text-sm font-bold",
                            isFree ? "text-zinc-600" : "text-zinc-100"
                          )}>
                            {data.subject}
                          </p>
                          {!isFree && data.subjectName && data.subjectName !== data.subject && (
                            <p className="text-[10px] text-zinc-500 font-medium">{data.subjectName}</p>
                          )}
                          {!isFree && data.facultyName && (
                            <p className="text-[10px] text-zinc-400 font-medium">{data.facultyName}</p>
                          )}
                          {!isFree && data.room && (
                            <p className="text-[10px] text-zinc-500 font-medium">Room {data.room}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-700">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {subjectAllocations.length > 0 && (
        <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          <div className="p-5 sm:p-6 lg:p-8 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-100">Subject Allocation</h2>
            <p className="mt-1 text-sm text-zinc-500">Faculty handling the subjects for class {classLabel}</p>
          </div>

          <div className="dashboard-table-shell">
            <table className="dashboard-table w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Code</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Subject</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Faculty Name</th>
                </tr>
              </thead>
              <tbody>
                {subjectAllocations.map((allocation, index) => (
                  <tr
                    key={`${allocation.code}-${index}`}
                    className="border-b border-zinc-800/80 last:border-0"
                  >
                    <td className="p-4 font-semibold text-zinc-100">{allocation.code}</td>
                    <td className="p-4 text-zinc-300">{allocation.subject}</td>
                    <td className="p-4 text-zinc-400">{allocation.facultyName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Marks Module ---

const Marks = () => {
  const { user } = useAuth();
  const [allResults, setAllResults] = useState<any[]>([]);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchMarks = async () => {
      try {
        const res = await axios.get(`/api/marks/student/${user.id}`);
        if (res.data && res.data.length > 0) {
          setAllResults(res.data);
          setCurrentResult(res.data[0]);
        }
      } catch (error) {
        console.error('Error fetching marks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [user]);

  if (loading) {
    return (
      <div className="dashboard-page dashboard-page--medium flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-page--wide dashboard-stack">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Academic Marks</h1>
          <p className="text-zinc-500">View your semester results and performance history</p>
        </div>

        {allResults.length > 1 && (
          <div className="dashboard-actions items-center rounded-xl border border-zinc-800 bg-zinc-900 p-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">History</span>
            <div className="flex flex-wrap gap-1">
              {allResults.map((res) => (
                <button
                  key={res.semester}
                  onClick={() => setCurrentResult(res)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    currentResult?.semester === res.semester 
                      ? "bg-zinc-100 text-zinc-950" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  )}
                >
                  {res.semester}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {currentResult ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-5 sm:p-6 lg:p-8 border-b border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-1">{currentResult.semester} Result</h2>
              <p className="text-zinc-500 font-mono text-sm">Exam: {currentResult.examType || 'Semester End'}</p>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-8">
              <div className="text-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">SGPA</p>
                <p className="text-2xl font-bold text-zinc-100">{currentResult.sgpa || '8.5'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">CGPA</p>
                <p className="text-2xl font-bold text-zinc-100">{currentResult.cgpa || '8.2'}</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <div className="dashboard-table-shell">
              <table className="dashboard-table w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Course Name</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Course Code</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-center">Grade</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-center">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {(currentResult.subjects || []).map((sub: any, i: number) => (
                    <tr key={i} className="group hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 font-medium text-zinc-200">{sub.name}</td>
                      <td className="py-4 font-mono text-zinc-500">{sub.code}</td>
                      <td className="py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase",
                          ['O', 'A+', 'A'].includes(sub.grade) ? "bg-green-500/10 text-green-500" :
                          ['B+', 'B'].includes(sub.grade) ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-4 text-center font-mono text-zinc-400">{sub.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
          <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">No marks recorded yet.</p>
        </div>
      )}
    </div>
  );
};

// --- Profile Module ---

const Profile = () => {
  const { profile } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string | null>('BIO-DATA');

  useEffect(() => {
    if (!profile?.id) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${profile.id}`);
        setStudentData(res.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [profile]);

  const BioField = ({ label, value }: { label: string, value: any }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <p className="text-sm text-zinc-100 font-medium">{value || 'N/A'}</p>
    </div>
  );

  const AccordionSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="border border-zinc-800 rounded-2xl overflow-hidden mb-4 bg-zinc-900 shadow-lg">
      <button 
        onClick={() => setActiveSection(activeSection === title ? null : title)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-zinc-800 transition-all group"
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={cn(
            "w-5 h-5 text-zinc-500 transition-transform duration-300",
            activeSection === title && "rotate-90 text-zinc-100"
          )} />
          <span className={cn(
            "font-bold text-sm tracking-widest uppercase",
            activeSection === title ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
          )}>
            {title}
          </span>
        </div>
      </button>
      <AnimatePresence>
        {activeSection === title && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-4 sm:p-6 lg:p-8 border-t border-zinc-800 bg-zinc-900/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="dashboard-page dashboard-page--wide">
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-6 sm:mb-8">Student Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 text-center shadow-2xl">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-700 shadow-inner overflow-hidden">
              {studentData?.photo ? (
                <img src={studentData.photo} alt={profile?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-16 h-16 text-zinc-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">{profile?.name}</h2>
            <p className="text-zinc-500 mb-6">{profile?.roll}</p>
            <div className="inline-block px-4 py-1 bg-zinc-800 rounded-full text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {profile?.dept}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
            <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Fee Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Fees</span>
                <span className="text-zinc-100 font-mono">₹{studentData?.fees?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Paid</span>
                <span className="text-green-500 font-mono">₹{studentData?.fees?.paid || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Pending</span>
                <span className="text-red-500 font-mono">₹{studentData?.fees?.pending || 0}</span>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <div className={cn(
                  "py-2 rounded-xl text-center text-xs font-bold uppercase tracking-widest",
                  studentData?.fees?.status === 'Paid' ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                )}>
                  {studentData?.fees?.status || 'Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <AccordionSection title="BIO-DATA">
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Personal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BioField label="Admission No" value={studentData?.admissionNo} />
                  <BioField label="Roll No" value={studentData?.roll} />
                  <BioField label="Name" value={studentData?.name} />
                  <BioField label="Course" value={studentData?.course} />
                  <BioField label="Branch" value={studentData?.branch} />
                  <BioField label="Semester" value={studentData?.semester} />
                  <BioField label="Gender" value={studentData?.gender} />
                  <BioField label="DOB" value={studentData?.dob} />
                  <BioField label="Nationality" value={studentData?.nationality} />
                  <BioField label="Religion" value={studentData?.religion} />
                  <BioField label="Entrance Type" value={studentData?.entranceType} />
                  <BioField label="Rank" value={studentData?.rank} />
                  <BioField label="Seat Type" value={studentData?.seatType} />
                  <BioField label="Category & Caste" value={studentData?.categoryCaste} />
                  <BioField label="Last Studied" value={studentData?.lastStudied} />
                  <BioField label="Joining Date" value={studentData?.joiningDate} />
                  <BioField label="Phone No" value={studentData?.phone} />
                  <BioField label="Mobile No" value={studentData?.mobile} />
                  <BioField label="Email" value={studentData?.email} />
                  <BioField label="Bank A/C No" value={studentData?.bankAcc} />
                  <BioField label="Aadhar No" value={studentData?.aadhar} />
                  <BioField label="Ration Card No" value={studentData?.rationCard} />
                  <BioField label="Scholarship" value={studentData?.scholarship} />
                  <BioField label="Class" value={studentData?.class} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Parent's Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BioField label="Father Name" value={studentData?.parents?.father?.name} />
                  <BioField label="Father Occupation" value={studentData?.parents?.father?.occupation} />
                  <BioField label="Father Mobile" value={studentData?.parents?.father?.mobile} />
                  <BioField label="Father Email" value={studentData?.parents?.father?.email} />
                  <BioField label="Mother Name" value={studentData?.parents?.mother?.name} />
                  <BioField label="Mother Occupation" value={studentData?.parents?.mother?.occupation} />
                  <BioField label="Mother Mobile" value={studentData?.parents?.mother?.mobile} />
                  <BioField label="Mother Email" value={studentData?.parents?.mother?.email} />
                  <BioField label="Annual Income" value={studentData?.parents?.annualIncome} />
                  <BioField label="Correspondence Address" value={studentData?.parents?.correspondenceAddress} />
                  <BioField label="Permanent Address" value={studentData?.parents?.permanentAddress} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Education Details</h4>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-zinc-600 uppercase">S.S.C</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <BioField label="Board" value={studentData?.education?.ssc?.board} />
                      <BioField label="H.T.No" value={studentData?.education?.ssc?.htNo} />
                      <BioField label="Year of Pass" value={studentData?.education?.ssc?.year} />
                      <BioField label="Institute" value={studentData?.education?.ssc?.institute} />
                      <BioField label="Max Marks" value={studentData?.education?.ssc?.max} />
                      <BioField label="Obtained Marks" value={studentData?.education?.ssc?.obtained} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-zinc-600 uppercase">Inter</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <BioField label="Board" value={studentData?.education?.inter?.board} />
                      <BioField label="H.T.No" value={studentData?.education?.inter?.htNo} />
                      <BioField label="Year of Pass" value={studentData?.education?.inter?.year} />
                      <BioField label="Institute" value={studentData?.education?.inter?.institute} />
                      <BioField label="Max Marks" value={studentData?.education?.inter?.max} />
                      <BioField label="Obtained Marks" value={studentData?.education?.inter?.obtained} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Guardian Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BioField label="Guardian Name" value={studentData?.guardian?.name} />
                  <BioField label="Guardian Address" value={studentData?.guardian?.address} />
                  <BioField label="Guardian Phone" value={studentData?.guardian?.phone} />
                  <BioField label="Guardian Mobile" value={studentData?.guardian?.mobile} />
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="PERFORMANCE (Present)">
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500">Current semester performance data will appear here.</p>
            </div>
          </AccordionSection>

          <AccordionSection title="PERFORMANCE (Past)">
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500">Previous semesters performance history will appear here.</p>
            </div>
          </AccordionSection>

          <AccordionSection title="BACKLOGS">
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500">No active backlogs recorded.</p>
            </div>
          </AccordionSection>

          <AccordionSection title="OUTINGS">
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500">History of outings and leaves will appear here.</p>
            </div>
          </AccordionSection>

          <AccordionSection title="COUNSELING DETAILS">
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500">Counseling session records will appear here.</p>
            </div>
          </AccordionSection>

          <AccordionSection title="DISCIPLINARY ACTION">
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500">No disciplinary actions recorded.</p>
            </div>
          </AccordionSection>

          <AccordionSection title="DETAINED DETAILS">
            <div className="text-center py-12">
              <LogOut className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500">Detention details will appear here if applicable.</p>
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
};

// --- Settings Module ---

const SettingsPage = () => {
  const { profile, user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [photo, setPhoto] = useState(profile?.photo || '');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        if (user?.id) {
          await axios.put(`/api/users/${user.id}`, {
            photo: base64String
          });
          setPhoto(base64String);
          toast.success('Profile photo updated successfully!');
        }
      } catch (error) {
        console.error('Error updating photo:', error);
        toast.error('Failed to update photo.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="dashboard-page dashboard-page--compact">
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-6 sm:mb-8">Settings</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Profile Settings</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 overflow-hidden relative group">
                {photo ? (
                  <img src={photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-10 h-10 text-zinc-500" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-100">Profile Photo</p>
                <p className="text-xs text-zinc-500">Update your profile picture</p>
                <label className="inline-block px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold cursor-pointer hover:bg-zinc-200 transition-all">
                  {uploading ? 'Uploading...' : 'Upload New Photo'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Account</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-zinc-100 font-medium text-sm">Email Address</p>
                <p className="text-xs text-zinc-500">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-800">
              <div>
                <p className="text-zinc-100 font-medium text-sm">Roll Number</p>
                <p className="text-xs text-zinc-500">{profile?.roll}</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Complaints</h2>
          <ComplaintCenter />
          {/*
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-zinc-100 font-medium">Raise a complaint</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Submit issues about academics, fees, attendance, hostel, or technical problems.
                </p>
              </div>
            </div>

            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => handleComplaintChange('category', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                >
                  {['Academic', 'Attendance', 'Fees', 'Hostel', 'Technical', 'Other'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Subject</label>
                <input
                  required
                  value={complaintForm.subject}
                  onChange={(e) => handleComplaintChange('subject', e.target.value)}
                  placeholder="Short title for your complaint"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                <textarea
                  required
                  value={complaintForm.description}
                  onChange={(e) => handleComplaintChange('description', e.target.value)}
                  placeholder="Describe the issue in detail"
                  className="w-full min-h-32 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComplaint}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-5 py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200 disabled:opacity-50"
              >
                <SendHorizonal className="w-4 h-4" />
                {submittingComplaint ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </form>

            <div className="border-t border-zinc-800 pt-6">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Recent Complaints</p>
              <div className="space-y-3">
                {complaints.length > 0 ? complaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{complaint.subject}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {complaint.category} • {formatComplaintDate(complaint.createdAt)}
                        </p>
                      </div>
                      <span className={cn(
                        'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
                        complaint.status === 'Resolved'
                          ? 'bg-green-500/10 text-green-400'
                          : complaint.status === 'In Review'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-blue-500/10 text-blue-400'
                      )}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">{complaint.description}</p>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center">
                    <p className="text-sm text-zinc-500">No complaints submitted yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          */}
        </section>
      </div>
    </div>
  );
};

// --- Main Dashboard ---

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!profile?.classId) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${profile.classId}`);
        const messages = Array.isArray(res.data) ? res.data : [];
        if (!isInitialLoad && messages.length > 0) {
          // Check for new messages (simplified for demo)
          const latestMsg = messages[0];
          toast.info(`New Message from ${latestMsg.senderName}`, {
            description: latestMsg.content.substring(0, 50) + (latestMsg.content.length > 50 ? '...' : ''),
          });
        }
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error fetching messages for notifications:', error);
      }
    };
    fetchMessages();
  }, [profile, isInitialLoad]);

  return (
    <div className="app-shell min-h-screen text-zinc-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="soft-button fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-[14px] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <main className="min-h-screen lg:pl-[288px]">
        <div className="min-h-[100dvh] overflow-y-auto premium-scrollbar pt-16 lg:pt-0">
          <Routes>
            <Route path="/" element={<Attendance />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/marks" element={<Marks />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
