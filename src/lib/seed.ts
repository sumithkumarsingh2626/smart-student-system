import { db, auth } from '../firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export const seedData = async () => {
  // Only seed if the user is the admin or the demo user
  if (auth.currentUser?.email !== 'sumithkumar2626@gmail.com' && auth.currentUser?.email !== 'shumee@bits.com') {
    return;
  }

  const seeded = localStorage.getItem('app_seeded_v6');
  if (seeded) return;

  console.log('Starting system seed...');

  try {
    // 1. Create Faculty User (Admin)
    const facultyUid = 'faculty_demo_123';
    await setDoc(doc(db, 'users', facultyUid), {
      uid: facultyUid,
      name: 'Dr. Sarah Smith',
      email: 'faculty@demo.com',
      role: 'faculty',
      dept: 'Computer Science'
    });

    // 1b. Ensure the admin email has faculty role in Firestore
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      uid: auth.currentUser.uid,
      name: 'System Admin',
      email: 'sumithkumar2626@gmail.com',
      role: 'admin',
      dept: 'Administration',
      isAdmin: true
    }, { merge: true });

    // 1c. Create requested demo faculty
    const demoFacultyUid = 'demo_faculty_sj2626';
    await setDoc(doc(db, 'users', demoFacultyUid), {
      uid: demoFacultyUid,
      name: 'Demo Faculty',
      email: 'sj2626_faculty@demo.com',
      role: 'faculty',
      dept: 'Engineering',
      loginId: 'SJ2626'
    });

    // 1d. Create requested demo admin
    const demoAdminUid = 'demo_admin_sj2626';
    await setDoc(doc(db, 'users', demoAdminUid), {
      uid: demoAdminUid,
      name: 'Demo Admin',
      email: 'sj2626_admin@demo.com',
      role: 'admin',
      dept: 'Administration',
      loginId: 'SJ2626'
    });

    // 2. Create Student User
    const studentUid = 'student_demo_123';
    await setDoc(doc(db, 'users', studentUid), {
      uid: studentUid,
      name: 'John Doe',
      email: 'student@demo.com',
      role: 'student',
      dept: 'Computer Science',
      roll: 'CS2026001',
      class: '3-A'
    });

    // 2b. Create requested demo student
    const demoStudentUid = 'demo_student_sj2626';
    await setDoc(doc(db, 'users', demoStudentUid), {
      uid: demoStudentUid,
      name: 'Demo Student',
      email: 'sj2626_student@demo.com',
      role: 'student',
      dept: 'Engineering',
      roll: 'SJ2626',
      class: '3-C'
    });

    // 3. Create Student Profile
    await setDoc(doc(db, 'students', studentUid), {
      uid: studentUid,
      roll: 'CS2026001',
      class: '3-A',
      photo: '',
      dob: '2005-01-01',
      contact: '+91 9876543210',
      fees: {
        total: 85000,
        paid: 50000,
        pending: 35000,
        status: 'Pending'
      }
    });

    await setDoc(doc(db, 'students', demoStudentUid), {
      uid: demoStudentUid,
      roll: 'SJ2626',
      class: '3-C',
      photo: '',
      dob: '2626',
      contact: '+91 1234567890',
      fees: {
        total: 100000,
        paid: 100000,
        pending: 0,
        status: 'Paid'
      }
    });

    // 4. Create Timetable
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
      '09:10-10:00', '10:00-10:50', '10:50-11:40', '11:40-12:30', 
      '12:30-01:10', '01:10-02:00', '02:00-02:50', '02:50-03:40', '03:40-04:30'
    ];
    const schedule: any = {};
    days.forEach(d => {
      schedule[d] = timeSlots.map(t => ({
        time: t,
        label: t === '12:30-01:10' ? 'LUNCH' : (Math.random() > 0.5 ? '3-A' : 'FREE')
      }));
    });
    await setDoc(doc(db, 'timetables', facultyUid), {
      facultyId: facultyUid,
      schedule
    });

    await setDoc(doc(db, 'timetables', demoFacultyUid), {
      facultyId: demoFacultyUid,
      schedule
    });

    // 5. Create Sample Messages
    await setDoc(doc(db, 'messages', 'sample_welcome_message'), {
      senderId: facultyUid,
      senderName: 'Dr. Sarah Smith',
      classes: ['3-A', '3-B'],
      content: 'Welcome to the new semester! Please check the updated timetable.',
      attachments: [],
      createdAt: serverTimestamp()
    });

    // 6. Create Sample Semester Results
    const sampleResults = [
      {
        sno: 1,
        courseName: 'Renewable Energy Sources',
        courseCode: 'R2331025A',
        grade: 'D',
        gradePoint: 6,
        credits: 3,
        status: 'Pass'
      },
      {
        sno: 2,
        courseName: 'Data Warehousing and Data Mining',
        courseCode: 'R2331051',
        grade: 'D',
        gradePoint: 6,
        credits: 3,
        status: 'Pass'
      },
      {
        sno: 3,
        courseName: 'Compiler Design',
        courseCode: 'R2331052',
        grade: 'C',
        gradePoint: 7,
        credits: 3,
        status: 'Pass'
      },
      {
        sno: 4,
        courseName: 'Design and Analysis of Algorithms',
        courseCode: 'R2331053',
        grade: 'D',
        gradePoint: 6,
        credits: 3,
        status: 'Pass'
      },
      {
        sno: 5,
        courseName: 'Object Oriented Analysis and Design',
        courseCode: 'R2331054A',
        grade: 'A',
        gradePoint: 9,
        credits: 3,
        status: 'Pass'
      },
      {
        sno: 6,
        courseName: 'Data Mining Lab',
        courseCode: 'R2331056',
        grade: 'S',
        gradePoint: 10,
        credits: 1.5,
        status: 'Pass'
      },
      {
        sno: 7,
        courseName: 'Compiler Design Lab',
        courseCode: 'R2331057',
        grade: 'A',
        gradePoint: 9,
        credits: 1.5,
        status: 'Pass'
      },
      {
        sno: 8,
        courseName: 'Tinkering Lab/ SWAYAM Plus - Android Application Development (with Flutter)',
        courseCode: 'R233105ES',
        grade: 'A',
        gradePoint: 9,
        credits: 1,
        status: 'Pass'
      },
      {
        sno: 9,
        courseName: 'Full Stack development-2',
        courseCode: 'R233105SC',
        grade: 'S',
        gradePoint: 10,
        credits: 2,
        status: 'Pass'
      },
      {
        sno: 10,
        courseName: 'Evaluation of Community Service Project',
        courseCode: 'R2331ECSI',
        grade: 'A',
        gradePoint: 9,
        credits: 2,
        status: 'Pass'
      }
    ];

    await setDoc(doc(db, 'semester_results', `${studentUid}_sem5`), {
      studentId: studentUid,
      studentName: 'John Doe',
      roll: 'CS2026001',
      class: '3-A',
      semester: 'Semester 5',
      sgpa: 7.72,
      cgpa: 7.85,
      totalCredits: 23,
      subjectsAppeared: 10,
      subjectsPassed: 10,
      collegeName: 'Baba Institute of Technology and Sciences',
      collegeCode: 'NR',
      results: sampleResults
    });

    await setDoc(doc(db, 'semester_results', `${studentUid}_sem4`), {
      studentId: studentUid,
      studentName: 'John Doe',
      roll: 'CS2026001',
      class: '3-A',
      semester: 'Semester 4',
      sgpa: 8.05,
      cgpa: 7.92,
      totalCredits: 22,
      subjectsAppeared: 8,
      subjectsPassed: 8,
      collegeName: 'Baba Institute of Technology and Sciences',
      collegeCode: 'NR',
      results: sampleResults.slice(0, 8)
    });

    await setDoc(doc(db, 'semester_results', `${demoStudentUid}_sem1`), {
      studentId: demoStudentUid,
      studentName: 'Demo Student',
      roll: 'SH2026001',
      class: '3-C',
      semester: 'Semester 1',
      sgpa: 8.12,
      cgpa: 8.12,
      totalCredits: 20,
      subjectsAppeared: 8,
      subjectsPassed: 8,
      collegeName: 'Baba Institute of Technology and Sciences',
      collegeCode: 'NR',
      results: sampleResults.slice(0, 8)
    });

    localStorage.setItem('app_seeded_v6', 'true');
    console.log('System seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};
