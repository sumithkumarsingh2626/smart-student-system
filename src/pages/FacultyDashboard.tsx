import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, LayoutDashboard, Users, MessageSquare, 
  Settings, LogOut, CheckCircle, Search, Filter,
  ChevronRight, Clock, FileText, Image as ImageIcon, Mic, Send, X,
  User as UserIcon, Phone, Mail, BookOpen, DollarSign, ShieldAlert, Plus,
  Menu,
  ChevronLeft, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { cn } from '../lib/utils';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import FacultyProfileModal from '../components/FacultyProfileModal';

import { io } from 'socket.io-client';

const socket = io(window.location.origin);

const normalizeBroadcastMessages = (data: any) =>
  Array.isArray(data)
    ? data.map((message: any) => ({
        ...message,
        senderName: message?.senderName || message?.facultyId?.name || 'Faculty',
        classes: Array.isArray(message?.classes)
          ? message.classes
          : message?.classId
            ? [message.classId]
            : [],
        attachments: Array.isArray(message?.attachments) ? message.attachments : [],
      }))
    : [];

const getMessageTime = (value: any) => {
  try {
    if (value?.toDate) {
      return value.toDate().getTime();
    }

    if (value) {
      const time = new Date(value).getTime();
      return Number.isNaN(time) ? 0 : time;
    }
  } catch {
    // Fall back to zero for invalid dates.
  }

  return 0;
};

const formatBroadcastTimestamp = (value: any) => {
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

const fetchTeachingNote = async (classLabel: string, time: string) => {
  const res = await axios.get(
    `/api/teaching-notes/${encodeURIComponent(classLabel)}/${encodeURIComponent(time)}`
  );
  return res.data?.note || '';
};

const getTeachingNoteKey = (classLabel: string, time: string) => `${classLabel}__${time}`;

const getScheduleItemLabel = (item: any) =>
  item?.label ||
  item?.subject ||
  item?.subjectName ||
  item?.subjectId?.name ||
  'Untitled Class';

const getAttendanceClassValue = (item: any) =>
  item?.class ||
  item?.className ||
  item?.section ||
  item?.classId?.name ||
  item?.classId ||
  '';

const getStudentClassValue = (student: any) =>
  student?.class ||
  student?.className ||
  student?.classId?.name ||
  student?.classId ||
  '';

// --- Sub-Components ---

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const basePath = profile?.role === 'admin' ? '/admin' : '/faculty';

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Classes', path: `${basePath}` },
    { icon: Calendar, label: 'Timetable', path: `${basePath}/timetable` },
    { icon: CheckCircle, label: 'Attendance', path: `${basePath}/attendance` },
    { icon: FileText, label: 'Marks', path: `${basePath}/marks` },
    { icon: MessageSquare, label: 'Message', path: `${basePath}/message` },
    { icon: Users, label: 'Students', path: `${basePath}/students` },
    ...(profile?.email === 'sumithkumar2626@gmail.com' ? [{ icon: ShieldAlert, label: 'Admin Panel', path: `${basePath}/admin` }] : []),
    { icon: Settings, label: 'Settings', path: `${basePath}/settings` },
  ];

  const facultyId = profile?.id || profile?._id;

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
                  <BookOpen className="h-5 w-5 text-zinc-100" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em] text-zinc-50">Smart Student</p>
                  <p className="text-xs text-zinc-500">
                    {profile?.role === 'admin' ? 'Admin dashboard' : 'Faculty dashboard'}
                  </p>
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
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="flex w-full items-center gap-3 rounded-[14px] border border-white/6 bg-white/[0.02] px-3 py-3 text-left transition-all hover:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-white/8 bg-white/[0.03]">
                  {profile?.photo ? (
                    <img
                      src={profile.photo}
                      alt={profile?.name || 'Faculty profile'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5 text-zinc-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">{profile?.name || 'Faculty Member'}</p>
                  <p className="truncate text-xs text-zinc-500">{profile?.dept || 'Department unavailable'}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </aside>
      <FacultyProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        facultyId={facultyId}
        initialProfile={profile}
      />
    </>
  );
};

// --- Pages ---

const Classes = () => {
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [expandedClassKey, setExpandedClassKey] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingClassKey, setSavingClassKey] = useState<string | null>(null);
  const [loadingClassKey, setLoadingClassKey] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchSchedule = async () => {
      try {
        const res = await axios.get(`/api/timetable/faculty/${user.id}`);
        if (res.data && res.data.schedule) {
          const day = format(new Date(), 'EEEE');
          const schedule = res.data.schedule[day] || [];
          const activeClasses = schedule
            .filter((cls: any) => getScheduleItemLabel(cls) !== 'FREE')
            .sort((a: any, b: any) => a.time.localeCompare(b.time));

          const classesWithNotes = await Promise.all(
            activeClasses.map(async (cls: any) => {
              const classLabel = getScheduleItemLabel(cls);
              try {
                const savedNote = await fetchTeachingNote(classLabel, cls.time);
                return { ...cls, label: classLabel, note: savedNote };
              } catch (noteError) {
                console.error('Error fetching note:', noteError);
                return { ...cls, label: classLabel, note: '' };
              }
            })
          );

          setTodayClasses(classesWithNotes);
          setNoteDrafts(
            classesWithNotes.reduce((drafts: Record<string, string>, cls: any) => {
              drafts[getTeachingNoteKey(cls.label, cls.time)] = cls.note || '';
              return drafts;
            }, {})
          );
        } else {
          setTodayClasses([]);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setTodayClasses([]);
      }
    };
    fetchSchedule();
  }, [user]);

  const openNoteEditor = async (cls: any) => {
    const classKey = getTeachingNoteKey(cls.label, cls.time);
    setExpandedClassKey(classKey);
    setLoadingClassKey(classKey);

    try {
      const savedNote = await fetchTeachingNote(cls.label, cls.time);
      setTodayClasses(prev =>
        prev.map(item =>
          getTeachingNoteKey(item.label, item.time) === classKey
            ? { ...item, note: savedNote }
            : item
        )
      );
      setNoteDrafts(prev => ({
        ...prev,
        [classKey]: savedNote
      }));
    } catch (error) {
      console.error('Error fetching note:', error);
      setNoteDrafts(prev => ({
        ...prev,
        [classKey]: cls.note || prev[classKey] || ''
      }));
    } finally {
      setLoadingClassKey(null);
    }
  };

  const closeNoteEditor = (cls: any) => {
    const classKey = getTeachingNoteKey(cls.label, cls.time);
    setExpandedClassKey(null);
    setNoteDrafts(prev => ({
      ...prev,
      [classKey]: cls.note || ''
    }));
  };

  const handleSaveNote = async (cls: any) => {
    if (!user) return;

    const classKey = getTeachingNoteKey(cls.label, cls.time);
    const nextNote = (noteDrafts[classKey] || '').trim();

    if (!nextNote) {
      toast.error('Please enter a note before submitting.');
      return;
    }

    setSavingClassKey(classKey);
    try {
      await axios.post('/api/teaching-notes', {
        classLabel: cls.label,
        time: cls.time,
        note: nextNote
      });

      setTodayClasses(prev =>
        prev.map(item =>
          getTeachingNoteKey(item.label, item.time) === classKey
            ? { ...item, note: nextNote }
            : item
        )
      );
      setNoteDrafts(prev => ({
        ...prev,
        [classKey]: nextNote
      }));
      setExpandedClassKey(null);
      toast.success('Teaching note saved!');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note.');
    } finally {
      setSavingClassKey(null);
    }
  };

  return (
    <div className="dashboard-page dashboard-page--wide dashboard-stack">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Today's Schedule</h1>
        <p className="text-zinc-500">{format(new Date(), 'EEEE, MMMM do')}</p>
      </div>

      <div className="grid gap-4">
        {todayClasses.length > 0 ? todayClasses.map((cls, idx) => {
          const classKey = getTeachingNoteKey(cls.label, cls.time);
          const isEditorOpen = expandedClassKey === classKey;
          const isSaving = savingClassKey === classKey;
          const isLoading = loadingClassKey === classKey;
          const attendanceClass = getAttendanceClassValue(cls);
          const attendanceLink = attendanceClass
            ? `attendance?class=${encodeURIComponent(attendanceClass)}&subject=${encodeURIComponent(cls.label)}&time=${encodeURIComponent(cls.time)}`
            : 'attendance';

          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={classKey}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 lg:p-6 shadow-xl transition-all hover:border-zinc-700"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="w-full text-left sm:w-24 sm:text-center">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Time</p>
                    <p className="text-lg font-mono text-zinc-100">{cls.time}</p>
                  </div>
                  <div className="hidden h-12 w-px bg-zinc-800 sm:block" />
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Class</p>
                    <p className="text-xl font-bold text-zinc-100">{cls.label}</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 xl:px-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Teaching Note</p>
                  <p className={cn(
                    "max-w-2xl text-sm leading-6",
                    cls.note ? "text-zinc-300" : "italic text-zinc-600"
                  )}>
                    {cls.note || 'No note added yet.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 xl:justify-end">
                  <button
                    type="button"
                    onClick={() => isEditorOpen ? closeNoteEditor(cls) : openNoteEditor(cls)}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-100 transition-all hover:bg-zinc-700"
                  >
                    {isEditorOpen ? 'Close' : cls.note ? 'Edit Note' : 'Add Note'}
                  </button>
                  <Link
                    to={attendanceLink}
                    className="rounded-xl bg-zinc-100 px-6 py-2 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200"
                  >
                    Mark Attendance
                  </Link>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isEditorOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-zinc-100">Add teaching note</p>
                        <p className="text-xs text-zinc-500">{cls.label} - {cls.time}</p>
                      </div>

                      <textarea
                        value={noteDrafts[classKey] || ''}
                        onChange={(e) => setNoteDrafts(prev => ({
                          ...prev,
                          [classKey]: e.target.value
                        }))}
                        placeholder="Enter the note for this class"
                        className="min-h-[120px] w-full rounded-2xl border border-zinc-700 bg-zinc-800 p-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                      />

                      <div className="mt-2 min-h-5 text-xs text-zinc-500">
                        {isLoading ? 'Loading latest note...' : 'Saved note will appear on this class card after submit.'}
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => closeNoteEditor(cls)}
                          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNote(cls)}
                          disabled={isSaving || !(noteDrafts[classKey] || '').trim()}
                          className="rounded-xl bg-zinc-100 px-5 py-2 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        }) : (
          <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
            <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No classes scheduled for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Timetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:10-10:00', '10:00-10:50', '10:50-11:40', '11:40-12:30', 
    '12:30-01:10', '01:10-02:00', '02:00-02:50', '02:50-03:40', '03:40-04:30'
  ];

  const fetchTimetable = async () => {
    try {
      const res = await axios.get(`/api/timetable/faculty/${user?.id}`);
      if (res.data && res.data.schedule) {
        setTimetable(res.data.schedule);
      } else {
        setTimetable(null);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchTimetable();
  }, [user]);

  const handleInitialize = () => {
    const initial: any = {};
    days.forEach(d => {
      initial[d] = timeSlots.map(t => ({ time: t, label: 'FREE' }));
    });
    setTimetable(initial);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await axios.post('/api/timetable', { 
        schedule: timetable 
      });
      setEditing(false);
      toast.success('Timetable saved!');
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast.error('Failed to save timetable. Please try again.');
    }
  };

  const openNoteModal = async (day: string, slot: any) => {
    if (slot.label === 'FREE') return;
    setSelectedSlot({ ...slot, day });
    try {
      const savedNote = await fetchTeachingNote(slot.label, slot.time);
      setNote(savedNote);
    } catch (error) {
      console.error('Error fetching note:', error);
      setNote('');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedSlot || !user) return;
    setSaving(true);
    try {
      await axios.post('/api/teaching-notes', {
        classLabel: selectedSlot.label,
        time: selectedSlot.time,
        note
      });
      setSelectedSlot(null);
      setNote('');
      toast.success('Teaching note saved!');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (day: string, time: string, label: string) => {
    const newTimetable = { ...timetable };
    newTimetable[day] = newTimetable[day].map((slot: any) => 
      slot.time === time ? { ...slot, label } : slot
    );
    setTimetable(newTimetable);
  };

  if (!timetable) {
    return (
      <div className="dashboard-page dashboard-page--medium flex flex-col items-center justify-center min-h-[60vh]">
        <Calendar className="w-16 h-16 text-zinc-800 mb-6" />
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">No Timetable Found</h2>
        <p className="text-zinc-500 mb-8 text-center max-w-md">
          It looks like you haven't set up your weekly schedule yet. 
          Click the button below to start building your timetable.
        </p>
        <button
          onClick={handleInitialize}
          className="px-8 py-3 bg-zinc-100 text-zinc-950 rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-xl"
        >
          Add Timetable
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-page--wide">
      <div className="dashboard-header mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Weekly Timetable</h1>
          <p className="text-zinc-500">Manage your weekly class schedule</p>
        </div>
        <div className="dashboard-actions">
          {editing && (
            <button
              onClick={() => { setEditing(false); fetchTimetable(); }}
              className="px-6 py-2 bg-zinc-800 text-zinc-400 rounded-xl font-bold hover:bg-zinc-700 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all shadow-lg",
              editing ? "bg-green-500 text-white" : "bg-zinc-100 text-zinc-950"
            )}
          >
            {editing ? 'Save Changes' : 'Edit Timetable'}
          </button>
        </div>
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
                {timeSlots.map((time, i) => {
                  const slot = timetable[day]?.find((s: any) => s.time === time);
                  const isLunch = time === '12:30-01:10';
                  
                  return (
                    <td key={i} className={cn(
                      "p-2 text-center transition-all min-w-[120px]",
                      isLunch ? "bg-zinc-800/40" : "hover:bg-zinc-800/30"
                    )}>
                      {isLunch ? (
                        <div className="text-[10px] text-center text-zinc-600 font-bold uppercase italic">Lunch</div>
                      ) : editing ? (
                        <input
                          value={slot?.label || ''}
                          onChange={(e) => updateSlot(day, time, e.target.value)}
                          placeholder="Class Label"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100 text-center"
                        />
                      ) : (
                        <div 
                          onClick={() => slot && openNoteModal(day, slot)}
                          className={cn(
                            "p-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer",
                            slot?.label === 'FREE' ? "text-zinc-600 cursor-default" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                          )}
                        >
                          {slot?.label}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="dashboard-modal-card bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100">Teaching Note</h2>
                  <p className="text-zinc-500 text-sm">{selectedSlot.label} - {selectedSlot.day} - {selectedSlot.time}</p>
                </div>
                <button onClick={() => setSelectedSlot(null)} className="text-zinc-500 hover:text-zinc-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Cover Unit 3 - Routing Algorithms"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100 min-h-[150px] mb-6"
              />
              <button
                onClick={handleSaveNote}
                disabled={saving}
                className="w-full bg-zinc-100 text-zinc-950 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Attendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'P' | 'A'>>({});
  const [loading, setLoading] = useState(false);
  const requestedClass = new URLSearchParams(location.search).get('class') || '';
  const requestedSubject = new URLSearchParams(location.search).get('subject') || '';
  const requestedTime = new URLSearchParams(location.search).get('time') || '';
  const classes = Array.from(new Set([
    '2-A', '2-B', '2-C', '2-AIML', '2-CS', '3-A', '3-B', '3-C', '4-A', '4-B', '4-C',
    requestedClass,
  ].filter(Boolean)));

  useEffect(() => {
    if (requestedClass) {
      setSelectedClass(requestedClass);
    }
  }, [requestedClass]);

  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`/api/users/role/student`);
        const list = Array.isArray(res.data)
          ? res.data.filter((student: any) => getStudentClassValue(student) === selectedClass)
          : [];
        setStudents(list);
        const initial: Record<string, 'P' | 'A'> = {};
        list.forEach((student: any) => {
          const studentId = student.id || student._id;
          if (studentId) initial[studentId] = 'P';
        });
        setAttendance(initial);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  const handleClassChange = (nextClass: string) => {
    setSelectedClass(nextClass);

    const params = new URLSearchParams(location.search);
    if (nextClass) {
      params.set('class', nextClass);
    } else {
      params.delete('class');
      params.delete('subject');
      params.delete('time');
    }

    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { replace: true }
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const date = format(new Date(), 'yyyy-MM-dd');
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status: status === 'P' ? 'present' : 'absent'
      }));

      await axios.post('/api/attendance', {
        classId: selectedClass,
        subjectId: '65f1a2b3c4d5e6f7a8b9c0d1',
        date,
        records
      });

      toast.success('Attendance marked successfully!');
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page dashboard-page--medium">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Mark Attendance</h1>
        <p className="text-zinc-500">
          {requestedClass
            ? `Opened ${requestedClass}${requestedSubject ? ` for ${requestedSubject}` : ''}${requestedTime ? ` at ${requestedTime}` : ''}.`
            : 'Select a class to mark student attendance'}
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col items-start gap-4 mb-6 sm:mb-8 sm:flex-row sm:items-center">
          <Filter className="w-5 h-5 text-zinc-500" />
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-100 focus:outline-none"
          >
            <option value="">Select Class</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {selectedClass && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 px-4 py-2 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <span>Student Name</span>
              <span>Status</span>
            </div>
            {students.map(student => {
              const studentId = student.id || student._id;

              return (
                <div key={studentId} className="flex flex-col gap-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{student.name}</p>
                      <p className="text-xs text-zinc-500">{student.roll}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setAttendance(prev => ({ ...prev, [studentId]: 'P' }))}
                      className={cn(
                        "w-10 h-10 rounded-xl font-bold transition-all",
                        attendance[studentId] === 'P' ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-500"
                      )}
                    >
                      P
                    </button>
                    <button
                      onClick={() => setAttendance(prev => ({ ...prev, [studentId]: 'A' }))}
                      className={cn(
                        "w-10 h-10 rounded-xl font-bold transition-all",
                        attendance[studentId] === 'A' ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-500"
                      )}
                    >
                      A
                    </button>
                  </div>
                </div>
              );
            })}
            {students.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-500">
                No students found for this class.
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || students.length === 0}
              className="w-full mt-8 bg-zinc-100 text-zinc-950 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Attendance'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Marks Management ---

interface SemesterResult {
  studentId: string;
  studentName: string;
  roll: string;
  class: string;
  semester: string;
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  subjectsAppeared: number;
  subjectsPassed: number;
  collegeName: string;
  collegeCode: string;
  results: {
    sno: number;
    courseName: string;
    courseCode: string;
    grade: string;
    gradePoint: number;
    credits: number;
    status: string;
  }[];
}

const MarksManager = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentResult, setStudentResult] = useState<SemesterResult | null>(null);
  const [allResults, setAllResults] = useState<SemesterResult[]>([]);
  const [loading, setLoading] = useState(false);

  const classes = ['2-A', '2-B', '2-C', '2-AIML', '2-CS', '3-A', '3-B', '3-C', '4-A', '4-B', '4-C'];

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`/api/users/role/student`);
        const studentList = Array.isArray(res.data) ? res.data.filter((s: any) => s.classId === selectedClass) : [];

        // Fetch CGPA for each student from marks API
        const studentsWithCGPA = await Promise.all(studentList.map(async (student: any) => {
          try {
            const marksRes = await axios.get(`/api/marks/student/${student.id}`);
            let latestCGPA = 0;
            if (Array.isArray(marksRes.data)) {
              marksRes.data.forEach((data: SemesterResult) => {
                if (data.cgpa > latestCGPA) latestCGPA = data.cgpa;
              });
            }
            return { ...student, cgpa: latestCGPA || 'N/A' };
          } catch (err) {
            return { ...student, cgpa: 'N/A' };
          }
        }));

        setStudents(studentsWithCGPA);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  const handleStudentClick = async (student: any) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const res = await axios.get(`/api/marks/student/${student.id}`);
      if (res.data && res.data.length > 0) {
        setAllResults(res.data);
        setStudentResult(res.data[0]);
      } else {
        setAllResults([]);
        setStudentResult(null);
      }
    } catch (error) {
      console.error('Error fetching semester results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.roll.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedStudent && studentResult) {
    return (
      <div className="dashboard-page dashboard-page--wide">
        <div className="dashboard-header mb-6">
          <button
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Student List
          </button>

          {allResults.length > 1 && (
            <div className="dashboard-actions items-center rounded-xl border border-zinc-800 bg-zinc-900 p-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Result History</span>
              <div className="flex flex-wrap gap-1">
                {allResults.map((res) => (
                  <button
                    key={res.semester}
                    onClick={() => setStudentResult(res)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      studentResult.semester === res.semester 
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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Result Header - Visual Representation */}
          <div className="p-5 sm:p-6 lg:p-8 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 shadow-inner">
                  {selectedStudent.photoURL ? (
                    <img src={selectedStudent.photoURL} alt={selectedStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-zinc-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-zinc-100 mb-1">{studentResult.studentName}</h2>
                  <p className="text-zinc-500 font-mono text-sm mb-2">Roll No: {studentResult.roll}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-zinc-400 font-medium text-sm">{studentResult.collegeName}</p>
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="inline-block px-4 py-2 bg-zinc-800 rounded-xl border border-zinc-700">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{studentResult.semester}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Result Body */}
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="dashboard-table-shell">
              <table className="dashboard-table w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">S.No</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Course Name</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Course Code</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-center">Grade</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-center">GP</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-center">Credits</th>
                    <th className="pb-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {studentResult.results.map((res) => (
                    <tr key={res.sno} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 text-zinc-500 font-mono">{res.sno}</td>
                      <td className="py-4 text-zinc-100 font-semibold">{res.courseName}</td>
                      <td className="py-4 text-zinc-500 font-mono">{res.courseCode}</td>
                      <td className="py-4 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold",
                          res.grade === 'S' || res.grade === 'A' ? "bg-green-500/10 text-green-500" :
                          res.grade === 'B' || res.grade === 'C' ? "bg-blue-500/10 text-blue-500" :
                          res.grade === 'D' ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {res.grade}
                        </span>
                      </td>
                      <td className="py-4 text-center font-bold text-zinc-300">{res.gradePoint}</td>
                      <td className="py-4 text-center text-zinc-500">{res.credits}</td>
                      <td className="py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          res.status === 'Pass' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Result Footer Stats */}
            <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">SGPA</p>
                <p className="text-2xl font-black text-zinc-100">{studentResult.sgpa}</p>
              </div>
              <div className="p-6 bg-zinc-100 rounded-2xl text-center shadow-xl">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">CGPA</p>
                <p className="text-2xl font-black text-zinc-950">{studentResult.cgpa}</p>
              </div>
              <div className="p-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Credits</p>
                <p className="text-2xl font-black text-zinc-100">{studentResult.totalCredits}</p>
              </div>
              <div className="p-6 bg-zinc-800/50 rounded-2xl border border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Passed</p>
                <p className="text-2xl font-black text-zinc-100">{studentResult.subjectsPassed}/{studentResult.subjectsAppeared}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-page--wide dashboard-stack">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Semester Exam Results</h1>
          <p className="text-zinc-500">Manage and view student academic performance</p>
        </div>
        <div className="dashboard-actions flex-col md:flex-row items-stretch md:items-center">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl flex-1">
            <Search className="w-5 h-5 text-zinc-500 ml-2" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-zinc-100 text-sm w-full focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl">
            <Filter className="w-5 h-5 text-zinc-500 ml-2" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-zinc-100 font-bold px-4 py-2 focus:outline-none min-w-[160px]"
            >
              <option value="" className="bg-zinc-900">Select Class</option>
              {classes.map(c => (
                <option key={c} value={c} className="bg-zinc-900">{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedClass ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <motion.button
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleStudentClick(student)}
                className="group bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-left hover:border-zinc-500 transition-all shadow-xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 group-hover:border-zinc-500 transition-colors">
                    {student.photoURL ? (
                      <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100 group-hover:text-zinc-100 transition-colors">{student.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono">{student.roll}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current CGPA</span>
                    <span className="text-xl font-black text-zinc-100">{student.cgpa}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-100 group-hover:text-zinc-950 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
              <p className="text-zinc-500">No students found in this class.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl p-8 sm:p-12 lg:p-20 text-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-2xl">
            <Search className="w-10 h-10 text-zinc-700" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-2">Select a class to begin</h3>
          <p className="text-zinc-500 max-w-xs mx-auto">Choose a class from the filter above to view student semester results and academic data.</p>
        </div>
      )}
    </div>
  );
};

const Message = () => {
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { profile, user } = useAuth();
  const classes = ['All', '2-A', '2-B', '2-C', '2-AIML', '2-CS', '3-A', '3-B', '3-C', '4-A', '4-B', '4-C'];

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/messages/faculty/${user?.id}`);
      const normalizedHistory = normalizeBroadcastMessages(res.data).sort(
        (a: any, b: any) => getMessageTime(b.createdAt) - getMessageTime(a.createdAt),
      );
      setHistory(normalizedHistory);
    } catch (error) {
      console.error('Error fetching message history:', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }
    fetchHistory();

    const handleReceiveMessage = (data: any) => {
      const [incomingMessage] = normalizeBroadcastMessages([data]);
      if (!incomingMessage) return;

      // If the message is for one of the classes this faculty is interested in (optional)
      // or if it's a message they just sent (though they already have it in history)
      if (data.senderId !== user.id) {
        setHistory(prev => [incomingMessage, ...(Array.isArray(prev) ? prev : [])]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [user]);

  const safeHistory = Array.isArray(history) ? history : [];

  const toggleClass = (c: string) => {
    if (c === 'All') {
      setSelectedClasses(prev => prev.includes('All') ? [] : ['All']);
      return;
    }
    setSelectedClasses(prev => {
      const filtered = prev.filter(x => x !== 'All');
      return filtered.includes(c) ? filtered.filter(x => x !== c) : [...filtered, c];
    });
  };

  const handleSend = async () => {
    if (!content || selectedClasses.length === 0 || !user) return;
    setLoading(true);
    try {
      const messageData = {
        senderId: user.id,
        senderName: profile?.name || 'Faculty',
        classes: selectedClasses,
        content,
        attachments: attachment ? [attachment] : [],
        createdAt: new Date().toISOString()
      };

      await axios.post('/api/messages', messageData);
      
      // Emit real-time message for each class
      selectedClasses.forEach(cls => {
        socket.emit('send_message', { ...messageData, classId: cls });
      });

      setContent('');
      setSelectedClasses([]);
      setAttachment(null);
      toast.success('Message broadcasted!');
      fetchHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const simulateFileUpload = (type: 'image' | 'file') => {
    // Mock file upload
    setAttachment({
      name: type === 'image' ? 'announcement_image.png' : 'lecture_notes.pdf',
      type: type
    });
  };

  return (
    <div className="dashboard-page dashboard-page--medium">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Broadcast Message</h1>
        <p className="text-zinc-500">Send updates and announcements to your classes</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl space-y-8">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Target Audience</label>
          <div className="flex flex-wrap gap-2">
            {classes.map(c => (
              <button
                key={c}
                onClick={() => toggleClass(c)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                  selectedClasses.includes(c) 
                    ? "bg-zinc-100 text-zinc-950 border-zinc-100" 
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500",
                  c === 'All' && !selectedClasses.includes('All') && "border-zinc-100/30 text-zinc-100"
                )}
              >
                {c === 'All' ? 'All Students' : c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Message Content</label>
          <div className="relative bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-transparent p-4 sm:p-6 text-zinc-100 focus:outline-none min-h-[150px]"
              placeholder="Type your announcement here..."
            />
            
            {attachment && (
              <div className="px-6 py-2 bg-zinc-900/50 border-t border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <FileText className="w-4 h-4" />
                  <span>{attachment.name}</span>
                </div>
                <button onClick={() => setAttachment(null)} className="text-zinc-500 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

             <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <div className="flex flex-wrap gap-2">
                <button onClick={() => simulateFileUpload('file')} className="p-2 text-zinc-500 hover:text-zinc-200 transition-all" title="Attach File"><FileText className="w-5 h-5" /></button>
                <button onClick={() => simulateFileUpload('image')} className="p-2 text-zinc-500 hover:text-zinc-200 transition-all" title="Attach Image"><ImageIcon className="w-5 h-5" /></button>
                <button className="p-2 text-zinc-500 hover:text-zinc-200 transition-all" title="Voice Message (UI Only)"><Mic className="w-5 h-5" /></button>
              </div>
              <button
                onClick={handleSend}
                disabled={loading || !content || selectedClasses.length === 0}
                className="bg-zinc-100 text-zinc-950 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Broadcast</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {historyLoading ? (
        <div className="mt-12 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/50 p-8 sm:p-12 lg:p-20 text-center">
          <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-500">Loading message history...</p>
        </div>
      ) : safeHistory.length > 0 ? (
        <div className="mt-12 space-y-6">
          <h2 className="text-xl font-bold text-zinc-100 px-2">Broadcast History</h2>
          <div className="space-y-4">
            {safeHistory.map((msg, index) => (
              <div key={msg._id || msg.id || `${msg.content}-${index}`} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-4">
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(msg.classes) && msg.classes.length > 0 ? msg.classes.map((c: string) => (
                      <span key={c} className="px-2 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-widest border border-zinc-700">
                        {c === 'All' ? 'All Students' : c}
                      </span>
                    )) : (
                      <span className="px-2 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-700">
                        No Audience
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {formatBroadcastTimestamp(msg.createdAt)}
                  </span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">{msg.content}</p>
                {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {msg.attachments.map((att: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-[10px] text-zinc-500 border border-zinc-700">
                        <FileText className="w-3 h-3" />
                        <span>{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-12 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/50 p-8 sm:p-12 lg:p-20 text-center">
          <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">No broadcast history yet.</p>
        </div>
      )}
    </div>
  );
};

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [studentMarks, setStudentMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/users/${id}`);
        const data = res.data;
        setStudent(data);
        setEditedStudent(data);
        
        // Fetch attendance stats
        const attRes = await axios.get(`/api/attendance/student/${id}`);
        const records = attRes.data;
        
        const total = records.length;
        const present = records.filter((r: any) => r.status === 'present' || r.status === 'P').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        // Subject-wise demo
        const subjects = ['CN', 'AI', 'SPM', 'CNS'];
        const subjectWise = subjects.map(sub => {
          const subRecords = records.filter((r: any) => r.subject === sub || (sub === 'CN' && r.subject === 'General')); 
          const subTotal = subRecords.length || 5; 
          const subPresent = subRecords.filter((r: any) => r.status === 'present' || r.status === 'P').length || 4;
          return {
            subject: sub,
            percentage: Math.round((subPresent / subTotal) * 100)
          };
        });

        setAttendanceStats({
          overall: percentage,
          subjectWise,
          history: records.slice(0, 5)
        });

        // Fetch Marks
        const marksRes = await axios.get(`/api/marks/student/${id}`);
        setStudentMarks(marksRes.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSaveProfile = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await axios.put(`/api/users/${id}`, editedStudent);
      setStudent(editedStudent);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-zinc-500">Loading profile...</div>;
  if (!student) return <div className="p-8 text-zinc-500">Student not found.</div>;

  const BioField = ({ label, value, field, section }: { label: string, value: any, field: string, section?: string }) => {
    const handleChange = (e: any) => {
      if (section) {
        if (section.startsWith('education_')) {
          const subSection = section.split('_')[1];
          setEditedStudent({
            ...editedStudent,
            education: {
              ...editedStudent.education,
              [subSection]: {
                ...editedStudent.education?.[subSection],
                [field]: e.target.value
              }
            }
          });
        } else if (section.startsWith('parents_')) {
          const subSection = section.split('_')[1];
          setEditedStudent({
            ...editedStudent,
            parents: {
              ...editedStudent.parents,
              [subSection]: {
                ...editedStudent.parents?.[subSection],
                [field]: e.target.value
              }
            }
          });
        } else {
          setEditedStudent({
            ...editedStudent,
            [section]: {
              ...editedStudent[section],
              [field]: e.target.value
            }
          });
        }
      } else {
        setEditedStudent({ ...editedStudent, [field]: e.target.value });
      }
    };

    return (
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
        {isEditing ? (
          <input
            value={value || ''}
            onChange={handleChange}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
          />
        ) : (
          <p className="text-sm text-zinc-100 font-medium">{value || 'N/A'}</p>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-page dashboard-page--wide">
      <div className="dashboard-header mb-6 sm:mb-8">
        <button 
          onClick={() => navigate('/faculty/students')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-all"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Directory
        </button>
        <div className="dashboard-actions">
          {isEditing ? (
            <>
              <button 
                onClick={() => { setIsEditing(false); setEditedStudent(student); }}
                className="px-6 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 text-center shadow-2xl">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-700 shadow-inner overflow-hidden relative group">
              {editedStudent?.photo ? (
                <img src={editedStudent.photo} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-16 h-16 text-zinc-500" />
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <ImageIcon className="w-8 h-8 text-zinc-100" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditedStudent({ ...editedStudent, photo: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
              )}
            </div>
            {isEditing && <p className="text-[10px] text-zinc-500 uppercase font-bold mb-4">Click image to upload</p>}
            <h2 className="text-2xl font-bold text-zinc-100">{student.name}</h2>
            <p className="text-zinc-500 mb-6">{student.roll}</p>
            <div className="inline-block px-4 py-1 bg-zinc-800 rounded-full text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {student.dept}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
            <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Attendance Overview
            </h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-800"
                    strokeDasharray="100, 100"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-green-500"
                    strokeDasharray={`${attendanceStats?.overall || 0}, 100`}
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-100">{attendanceStats?.overall || 0}%</span>
                  <span className="text-[8px] text-zinc-500 uppercase font-bold">Overall</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {attendanceStats?.subjectWise.map((sub: any) => (
                <div key={sub.subject} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 font-medium">{sub.subject}</span>
                    <span className="text-zinc-100 font-bold">{sub.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-zinc-100 transition-all duration-1000" 
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
            <h3 className="font-bold text-zinc-100 mb-8 pb-4 border-b border-zinc-800">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BioField label="Admission No" value={editedStudent?.admissionNo} field="admissionNo" />
              <BioField label="Roll No" value={editedStudent?.roll} field="roll" />
              <BioField label="Name" value={editedStudent?.name} field="name" />
              <BioField label="Course" value={editedStudent?.course} field="course" />
              <BioField label="Branch" value={editedStudent?.branch} field="branch" />
              <BioField label="Semester" value={editedStudent?.semester} field="semester" />
              <BioField label="Gender" value={editedStudent?.gender} field="gender" />
              <BioField label="DOB" value={editedStudent?.dob} field="dob" />
              <BioField label="Nationality" value={editedStudent?.nationality} field="nationality" />
              <BioField label="Religion" value={editedStudent?.religion} field="religion" />
              <BioField label="Entrance Type" value={editedStudent?.entranceType} field="entranceType" />
              <BioField label="Rank" value={editedStudent?.rank} field="rank" />
              <BioField label="Seat Type" value={editedStudent?.seatType} field="seatType" />
              <BioField label="Category & Caste" value={editedStudent?.categoryCaste} field="categoryCaste" />
              <BioField label="Last Studied" value={editedStudent?.lastStudied} field="lastStudied" />
              <BioField label="Joining Date" value={editedStudent?.joiningDate} field="joiningDate" />
              <BioField label="Phone No" value={editedStudent?.phone} field="phone" />
              <BioField label="Mobile No" value={editedStudent?.mobile} field="mobile" />
              <BioField label="Email" value={editedStudent?.email} field="email" />
              <BioField label="Bank A/C No" value={editedStudent?.bankAcc} field="bankAcc" />
              <BioField label="Aadhar No" value={editedStudent?.aadhar} field="aadhar" />
              <BioField label="Ration Card No" value={editedStudent?.rationCard} field="rationCard" />
              <BioField label="Scholarship" value={editedStudent?.scholarship} field="scholarship" />
              <BioField label="Class" value={editedStudent?.class} field="class" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
            <h3 className="font-bold text-zinc-100 mb-8 pb-4 border-b border-zinc-800">Parent's Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BioField label="Father Name" value={editedStudent?.parents?.father?.name} field="name" section="parents_father" />
              <BioField label="Father Occupation" value={editedStudent?.parents?.father?.occupation} field="occupation" section="parents_father" />
              <BioField label="Father Mobile" value={editedStudent?.parents?.father?.mobile} field="mobile" section="parents_father" />
              <BioField label="Father Email" value={editedStudent?.parents?.father?.email} field="email" section="parents_father" />
              <BioField label="Mother Name" value={editedStudent?.parents?.mother?.name} field="name" section="parents_mother" />
              <BioField label="Mother Occupation" value={editedStudent?.parents?.mother?.occupation} field="occupation" section="parents_mother" />
              <BioField label="Mother Mobile" value={editedStudent?.parents?.mother?.mobile} field="mobile" section="parents_mother" />
              <BioField label="Mother Email" value={editedStudent?.parents?.mother?.email} field="email" section="parents_mother" />
              <BioField label="Annual Income" value={editedStudent?.parents?.annualIncome} field="annualIncome" section="parents" />
              <BioField label="Correspondence Address" value={editedStudent?.parents?.correspondenceAddress} field="correspondenceAddress" section="parents" />
              <BioField label="Permanent Address" value={editedStudent?.parents?.permanentAddress} field="permanentAddress" section="parents" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
            <h3 className="font-bold text-zinc-100 mb-8 pb-4 border-b border-zinc-800">Education Details</h3>
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">S.S.C</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <BioField label="Board" value={editedStudent?.education?.ssc?.board} field="board" section="education_ssc" />
                  <BioField label="H.T.No" value={editedStudent?.education?.ssc?.htNo} field="htNo" section="education_ssc" />
                  <BioField label="Year of Pass" value={editedStudent?.education?.ssc?.year} field="year" section="education_ssc" />
                  <BioField label="Institute" value={editedStudent?.education?.ssc?.institute} field="institute" section="education_ssc" />
                  <BioField label="Max Marks" value={editedStudent?.education?.ssc?.max} field="max" section="education_ssc" />
                  <BioField label="Obtained Marks" value={editedStudent?.education?.ssc?.obtained} field="obtained" section="education_ssc" />
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Inter</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <BioField label="Board" value={editedStudent?.education?.inter?.board} field="board" section="education_inter" />
                  <BioField label="H.T.No" value={editedStudent?.education?.inter?.htNo} field="htNo" section="education_inter" />
                  <BioField label="Year of Pass" value={editedStudent?.education?.inter?.year} field="year" section="education_inter" />
                  <BioField label="Institute" value={editedStudent?.education?.inter?.institute} field="institute" section="education_inter" />
                  <BioField label="Max Marks" value={editedStudent?.education?.inter?.max} field="max" section="education_inter" />
                  <BioField label="Obtained Marks" value={editedStudent?.education?.inter?.obtained} field="obtained" section="education_inter" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
            <h3 className="font-bold text-zinc-100 mb-8 pb-4 border-b border-zinc-800">Guardian Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BioField label="Guardian Name" value={editedStudent?.guardian?.name} field="name" section="guardian" />
              <BioField label="Guardian Address" value={editedStudent?.guardian?.address} field="address" section="guardian" />
              <BioField label="Guardian Phone" value={editedStudent?.guardian?.phone} field="phone" section="guardian" />
              <BioField label="Guardian Mobile" value={editedStudent?.guardian?.mobile} field="mobile" section="guardian" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
            <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Academic Marks History
            </h3>
            <div className="space-y-4">
              {studentMarks.length > 0 ? studentMarks.map((m, idx) => (
                <div key={m.id} className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800/50 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{m.subject}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{m.examType} - {m.semester}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-zinc-100">{m.score}/{m.total}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {m.createdAt ? format(m.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-center py-8 text-zinc-600 text-sm italic">No marks recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentsList = () => {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [newStudent, setNewStudent] = useState<any>({
    name: '',
    roll: '',
    class: '3-A',
    email: '',
    dept: 'Computer Science',
    contact: '',
    photo: '',
    dob: ''
  });
  const classes = ['2-A', '2-B', '2-C', '2-AIML', '2-CS', '3-A', '3-B', '3-C', '4-A', '4-B', '4-C'];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`/api/users/role/student`);
        let list = Array.isArray(res.data) ? res.data : [];
        if (selectedClass) {
          list = list.filter((s: any) => s.classId === selectedClass);
        }
        setStudents(list);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        name: newStudent.name,
        email: newStudent.email,
        password: 'password123', // Default password
        role: 'student',
        classId: newStudent.class,
        roll: newStudent.roll,
        dept: newStudent.dept,
        dob: newStudent.dob,
        contact: newStudent.contact,
        photo: newStudent.photo || ''
      });

      setIsAddModalOpen(false);
      setNewStudent({ name: '', roll: '', class: '3-A', email: '', dept: 'Computer Science', contact: '', photo: '', dob: '' });
      toast.success('Student added successfully!');
      // Refresh list
      const res = await axios.get(`/api/users/role/student`);
      setStudents(res.data.filter((s: any) => !selectedClass || s.classId === selectedClass));
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (s.roll?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-page dashboard-page--wide">
      <div className="dashboard-header mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Student Directory</h1>
          <p className="text-zinc-500">Search and manage student profiles</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 bg-zinc-100 text-zinc-950 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-lg sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
          />
        </div>
        <div className="flex w-full gap-4 md:w-auto">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-8 py-3 text-zinc-100 focus:outline-none appearance-none"
            >
              <option value="">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/faculty/students/${student.id}`)}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-500 transition-all cursor-pointer group shadow-xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700">
                <UserIcon className="w-7 h-7 text-zinc-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 group-hover:text-white transition-all">{student.name}</h3>
                <p className="text-xs text-zinc-500 font-mono">{student.roll}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-700 ml-auto group-hover:text-zinc-100 transition-all" />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Class</span>
                <span className="text-sm text-zinc-300">{student.class}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attendance</span>
                <span className="text-sm font-bold text-green-500">85%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="dashboard-modal-card bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-100">Add New Student</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-zinc-100">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 overflow-hidden relative group">
                    {newStudent.photo ? (
                      <img src={newStudent.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-zinc-500" />
                    )}
                    <label className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                      <ImageIcon className="w-6 h-6 text-zinc-100" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewStudent({ ...newStudent, photo: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>

                <div className="dashboard-form-grid-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                    <input
                      required
                      value={newStudent.name}
                      onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Roll Number</label>
                    <input
                      required
                      value={newStudent.roll}
                      onChange={e => setNewStudent({ ...newStudent, roll: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                  <input
                    required
                    type="email"
                    value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                  />
                </div>

                <div className="dashboard-form-grid-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Class</label>
                    <select
                      value={newStudent.class}
                      onChange={e => setNewStudent({ ...newStudent, class: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none"
                    >
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Department</label>
                    <input
                      value={newStudent.dept}
                      onChange={e => setNewStudent({ ...newStudent, dept: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                    />
                  </div>
                </div>

                <div className="dashboard-form-grid-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Date of Birth</label>
                    <input
                      required
                      type="date"
                      value={newStudent.dob}
                      onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Contact Number</label>
                    <input
                      value={newStudent.contact}
                      onChange={e => setNewStudent({ ...newStudent, contact: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-100 text-zinc-950 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-all shadow-xl disabled:opacity-50 mt-4"
                >
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Students = () => {
  return (
    <Routes>
      <Route path="/" element={<StudentsList />} />
      <Route path="/:id" element={<StudentProfile />} />
    </Routes>
  );
};

const SettingsPage = () => {
  return (
    <div className="dashboard-page dashboard-page--compact">
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-6 sm:mb-8">Settings</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Appearance</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-100 font-medium">Dark Mode</p>
                <p className="text-xs text-zinc-500">Enable dark theme for the dashboard</p>
              </div>
              <div className="w-12 h-6 bg-zinc-100 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-zinc-950 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Notifications</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-zinc-100 font-medium">Class Reminders</p>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-zinc-100" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-zinc-100 font-medium">Student Messages</p>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-zinc-100" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  return (
    <div className="dashboard-page dashboard-page--wide">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">Admin Control Panel</h1>
        <p className="text-zinc-500">Overall system management and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Students', value: '1,240', color: 'text-blue-500' },
          { label: 'Active Faculty', value: '48', color: 'text-green-500' },
          { label: 'Attendance Rate', value: '94.2%', color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl">
        <h3 className="text-xl font-bold text-zinc-100 mb-6">System Logs</h3>
        <div className="space-y-4">
          {[
            'New student SH2026001 registered',
            'Attendance marked for Class 3-A by Dr. Sarah',
            'Timetable updated for Faculty ID: faculty_demo_123',
            'Broadcast message sent to 4 classes',
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800/50">
              <div className="w-2 h-2 bg-zinc-700 rounded-full" />
              <p className="text-sm text-zinc-400">{log}</p>
              <span className="ml-auto text-[10px] text-zinc-600 font-mono">2 mins ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard ---

const FacultyDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <Route path="/" element={<Classes />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/marks" element={<MarksManager />} />
            <Route path="/message" element={<Message />} />
            <Route path="/students/*" element={<Students />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;
