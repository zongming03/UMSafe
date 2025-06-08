import mongoose from 'mongoose';
import FacultyModel  from '../models/Room.js';
import dotenv from 'dotenv';
import { getNextRoomCode } from '../utils/getNextRoomCode.js'; 
dotenv.config();

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const facultyCode = 'fcsit';

    const blockA = {
      name: 'Block A',
      faculty_block_rooms: await Promise.all([
        'MM1 Lab',
        'MM2 Lab',
        'Robotic Lab',
        'CCNA Lab',
        'BK1',
        'BK2',
        'Foyer A',
        'The Cube',
        'ML Lab',
        'A Floor 1 Area',
        'A Floor 2 Area',
        'A Floor 3 Area'
      ].map(async (roomName) => ({
        name: roomName,
        code: await getNextRoomCode(facultyCode),
      })))
    };

    const blockB = {
      name: 'Block B',
      faculty_block_rooms: await Promise.all([
        'MM3',
        'MM4',
        'MM6',
        'CCNA Lab',
        'BK1',
        'BK2',
        'Foyer B',
        'B Floor 1 Area',
        'B Floor 2 Area',
        'B Floor 3 Area'
      ].map(async (roomName) => ({
        name: roomName,
        code: await getNextRoomCode(facultyCode),
      })))
    };

    const newFaculty = new FacultyModel({
      name: 'Faculty of Computer Science and Information Technology',
      code: facultyCode,
      faculty_blocks: [blockA, blockB]
    });

    await newFaculty.save();
    console.log('✅ Faculty added successfully with room codes.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error inserting faculty:', err);
    process.exit(1);
  }
};

main();

