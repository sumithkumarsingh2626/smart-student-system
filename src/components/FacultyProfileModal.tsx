import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { Building2, Mail, Phone, Shield, User as UserIcon, X } from 'lucide-react';

interface FacultyProfileModalProps {
  open: boolean;
  onClose: () => void;
  facultyId?: string;
  initialProfile?: any;
}

const getDisplayValue = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Not Available';
  }

  if (value === null || value === undefined || value === '') {
    return 'Not Available';
  }

  return String(value);
};

const formatRole = (role?: string) => {
  if (!role) return 'Not Available';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export default function FacultyProfileModal({
  open,
  onClose,
  facultyId,
  initialProfile,
}: FacultyProfileModalProps) {
  const [facultyDetails, setFacultyDetails] = useState<any>(initialProfile ?? null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFacultyDetails(initialProfile ?? null);

    if (!facultyId) {
      return;
    }

    const fetchFacultyProfile = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/users/${facultyId}`);
        setFacultyDetails(res.data || initialProfile || null);
      } catch {
        setFacultyDetails(initialProfile || null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacultyProfile();
  }, [facultyId, initialProfile, open]);

  const profileImage = facultyDetails?.photo || facultyDetails?.avatar || '';
  const department = facultyDetails?.dept || facultyDetails?.department;
  const phone = facultyDetails?.phone || facultyDetails?.contact || facultyDetails?.mobile;
  const additionalFields = [
    { label: 'Login ID', value: facultyDetails?.loginId },
    { label: 'User ID', value: facultyDetails?.id || facultyDetails?._id },
    { label: 'Class ID', value: facultyDetails?.classId },
    {
      label: 'Subjects',
      value: Array.isArray(facultyDetails?.subjects) ? facultyDetails.subjects.length : undefined,
    },
  ].filter((field) => field.value !== undefined && field.value !== null && field.value !== '');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f14]/82 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="surface-panel w-full max-w-2xl rounded-[20px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/6 p-6">
              <div>
                <h2 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-zinc-100">Faculty Profile</h2>
                <p className="mt-1 text-sm text-zinc-500">Profile details from your current account</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="soft-button flex h-10 w-10 items-center justify-center rounded-[12px] p-0 text-zinc-400 hover:text-zinc-100"
                aria-label="Close profile modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="section-shell rounded-[18px] p-6 text-center">
                  <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-[18px] border border-white/6 bg-white/[0.03]">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={facultyDetails?.name || 'Faculty profile'}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon className="h-12 w-12 text-zinc-500" />
                    )}
                  </div>
                  <p className="text-lg font-bold text-zinc-100">
                    {getDisplayValue(facultyDetails?.name)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{formatRole(facultyDetails?.role)}</p>
                  {isLoading && (
                    <p className="mt-3 text-xs text-zinc-500">Refreshing profile...</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="section-shell rounded-[16px] p-4">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        <UserIcon className="h-4 w-4" /> Full Name
                      </p>
                      <p className="text-sm text-zinc-100">{getDisplayValue(facultyDetails?.name)}</p>
                    </div>

                    <div className="section-shell rounded-[16px] p-4">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        <Mail className="h-4 w-4" /> Email
                      </p>
                      <p className="text-sm text-zinc-100">{getDisplayValue(facultyDetails?.email)}</p>
                    </div>

                    <div className="section-shell rounded-[16px] p-4">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        <Building2 className="h-4 w-4" /> Department
                      </p>
                      <p className="text-sm text-zinc-100">{getDisplayValue(department)}</p>
                    </div>

                    <div className="section-shell rounded-[16px] p-4">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        <Shield className="h-4 w-4" /> Role
                      </p>
                      <p className="text-sm text-zinc-100">{formatRole(facultyDetails?.role)}</p>
                    </div>

                    <div className="section-shell rounded-[16px] p-4 sm:col-span-2">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        <Phone className="h-4 w-4" /> Phone Number
                      </p>
                      <p className="text-sm text-zinc-100">{getDisplayValue(phone)}</p>
                    </div>
                  </div>

                  {additionalFields.length > 0 && (
                    <div className="section-shell rounded-[16px] p-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        Additional Details
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {additionalFields.map((field) => (
                          <div key={field.label}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                              {field.label}
                            </p>
                            <p className="mt-1 text-sm text-zinc-100">{getDisplayValue(field.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
