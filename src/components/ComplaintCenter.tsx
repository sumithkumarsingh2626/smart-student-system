import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { format } from 'date-fns';
import { SendHorizonal, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

type ComplaintCategory =
  | 'Academic'
  | 'Attendance'
  | 'Fees'
  | 'Hostel'
  | 'Technical'
  | 'Other';

interface ComplaintFormState {
  category: ComplaintCategory;
  subject: string;
  description: string;
}

interface ComplaintRecord {
  _id: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: 'Open' | 'In Review' | 'Resolved';
  createdAt: string;
}

const complaintCategories: ComplaintCategory[] = [
  'Academic',
  'Attendance',
  'Fees',
  'Hostel',
  'Technical',
  'Other',
];

const initialComplaintForm: ComplaintFormState = {
  category: 'Academic',
  subject: '',
  description: '',
};

const formatComplaintDate = (value: string) => {
  try {
    return format(new Date(value), 'MMM d, yyyy h:mm a');
  } catch {
    return 'Just now';
  }
};

export default function ComplaintCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [complaintForm, setComplaintForm] = useState<ComplaintFormState>(initialComplaintForm);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchComplaints = async () => {
      setIsLoadingComplaints(true);
      try {
        const res = await axios.get('/api/complaints/mine');
        setComplaints(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setIsLoadingComplaints(false);
      }
    };

    fetchComplaints();
  }, [isOpen]);

  const handleComplaintChange = (
    field: keyof ComplaintFormState,
    value: string,
  ) => {
    setComplaintForm((current) => ({ ...current, [field]: value }));
  };

  const closeModal = () => {
    setIsOpen(false);
    setComplaintForm(initialComplaintForm);
  };

  const isFormValid =
    complaintForm.subject.trim().length > 0 &&
    complaintForm.description.trim().length > 0;

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Subject and description are required');
      return;
    }

    setSubmittingComplaint(true);
    try {
      const payload = {
        ...complaintForm,
        subject: complaintForm.subject.trim(),
        description: complaintForm.description.trim(),
      };

      const { data } = await axios.post('/api/complaints', payload);
      setComplaints((current) => [data, ...current]);
      setComplaintForm(initialComplaintForm);
      toast.success('Complaint submitted successfully');
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <>
      <div className="surface-panel rounded-[18px] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Student Support</p>
            <p className="text-xs text-zinc-500 mt-1">
              Share any academic, hostel, fee, or technical issue with the administration team.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="premium-button inline-flex items-center justify-center rounded-[12px] px-5 py-3 text-sm font-semibold"
          >
            Raise Complaint
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f14]/82 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="surface-panel w-full max-w-2xl rounded-[20px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/6 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/8 bg-white/[0.03]">
                    <ShieldAlert className="h-6 w-6 text-red-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-zinc-100">Raise Complaint</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Tell us what went wrong and we will route it to the right team.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="soft-button flex h-10 w-10 items-center justify-center rounded-[12px] p-0 text-zinc-400 hover:text-zinc-100"
                  aria-label="Close complaint form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto p-6">
                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      Category
                    </label>
                    <select
                      value={complaintForm.category}
                      onChange={(e) =>
                        handleComplaintChange('category', e.target.value as ComplaintCategory)
                      }
                      className="w-full rounded-[12px] border border-white/8 bg-white/[0.03] p-3 text-zinc-100"
                    >
                      {complaintCategories.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={complaintForm.subject}
                      onChange={(e) => handleComplaintChange('subject', e.target.value)}
                      placeholder="Short title for your complaint"
                      className="w-full rounded-[12px] border border-white/8 bg-white/[0.03] p-3 text-zinc-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      Description
                    </label>
                    <textarea
                      value={complaintForm.description}
                      onChange={(e) => handleComplaintChange('description', e.target.value)}
                      placeholder="Describe the issue in detail"
                      className="min-h-32 w-full rounded-[12px] border border-white/8 bg-white/[0.03] p-3 text-zinc-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="soft-button rounded-[12px] px-4 py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid || submittingComplaint}
                      className="premium-button inline-flex items-center justify-center gap-2 rounded-[12px] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <SendHorizonal className="h-4 w-4" />
                      {submittingComplaint ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                  </div>
                </form>

                <div className="mt-8 border-t border-white/6 pt-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Recent Complaints
                  </p>
                  <div className="mt-4 space-y-3">
                    {isLoadingComplaints ? (
                      <div className="section-shell rounded-[16px] p-4 text-sm text-zinc-500">
                        Loading complaints...
                      </div>
                    ) : complaints.length > 0 ? (
                      complaints.map((complaint) => (
                        <div
                          key={complaint._id}
                          className="section-shell rounded-[16px] p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-zinc-100">
                                {complaint.subject}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {complaint.category} - {formatComplaintDate(complaint.createdAt)}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
                                complaint.status === 'Resolved'
                                  ? 'bg-green-500/10 text-green-400'
                                  : complaint.status === 'In Review'
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-blue-500/10 text-blue-400',
                              )}
                            >
                              {complaint.status}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                            {complaint.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="section-shell rounded-[16px] border-dashed p-6 text-center">
                        <p className="text-sm text-zinc-500">No complaints submitted yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
