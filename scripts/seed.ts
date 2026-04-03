import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import connectDB from '../config/db.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Class.deleteMany({});
    await Subject.deleteMany({});

    console.log('Data cleared...');

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'sumithkumar2626@gmail.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Admin created...');

    // Create Faculty
    const faculty = await User.create({
      name: 'Dr. Sarah Smith',
      email: 'faculty@demo.com',
      password: 'faculty123',
      role: 'faculty'
    });

    console.log('Faculty created...');

    // Create Subjects
    const sub1 = await Subject.create({ name: 'Data Structures', code: 'CS101', facultyId: faculty._id, classId: new mongoose.Types.ObjectId() });
    const sub2 = await Subject.create({ name: 'Algorithms', code: 'CS102', facultyId: faculty._id, classId: new mongoose.Types.ObjectId() });

    console.log('Subjects created...');

    // Create Class
    const class1 = await Class.create({
      name: '3-A',
      department: 'Computer Science',
      year: '3rd Year',
      faculty: [faculty._id],
      students: []
    });

    // Update subjects with real classId
    sub1.classId = class1._id;
    sub2.classId = class1._id;
    await sub1.save();
    await sub2.save();

    console.log('Class created...');

    // Create Student
    const student = await User.create({
      name: 'John Doe',
      email: 'JS2626',
      password: '2626',
      role: 'student',
      classId: class1._id
    });

    // Add student to class
    class1.students.push(student._id);
    await class1.save();

    console.log('Student created and added to class...');

    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

seed();
