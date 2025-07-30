import mongoose from 'mongoose';
import FacultyModel from '../models/Room.js'; // Assuming Room.js exports FacultyModel
import dotenv from 'dotenv';

dotenv.config();

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');


    await FacultyModel.deleteMany({});
    console.log('Cleared existing Faculty data to prevent duplicates.');

    const blockA = {
      name: 'Block A',
      faculty_block_rooms: [
        { name: 'MM1 Lab' },
        { name: 'MM2 Lab' },
        { name: 'Robotic Lab' },
        { name: 'CCNA Lab' },
        { name: 'BK1' },
        { name: 'BK2' },
        { name: 'Foyer A' },
        { name: 'The Cube' },
        { name: 'ML Lab' },
        { name: 'A Floor 1 Area' },
        { name: 'A Floor 2 Area' },
        { name: 'A Floor 3 Area' }
      ]
    };

    const blockB = {
      name: 'Block B',
      faculty_block_rooms: [
        { name: 'MM3' },
        { name: 'MM4' },
        { name: 'MM6' },
        { name: 'CCNA Lab' },
        { name: 'BK1' },
        { name: 'BK2' },
        { name: 'Foyer B' },
        { name: 'B Floor 1 Area' },
        { name: 'B Floor 2 Area' },
        { name: 'B Floor 3 Area' }
      ]
    };

    const newFaculty = new FacultyModel({
      name: 'Faculty of Computer Science and Information Technology',
      faculty_blocks: [blockA, blockB]
    });

    await newFaculty.save();
    console.log('✅ Faculty, blocks, and rooms added successfully.');

    process.exit(0);

  } catch (err) {
    console.error('❌ Error inserting faculty data:', err);
    process.exit(1);
  }
};

main();