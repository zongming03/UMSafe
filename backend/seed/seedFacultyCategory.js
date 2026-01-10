import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FacultyCategoryModel from '../models/FacultyCategory.js';

dotenv.config();

const facultyId = '6915cd5e4297c05ff2598c55';
const facultyName = 'Faculty of Computer Science and Information Technology';

const categories = [
  {
    name: 'Cleanliness',
    description: 'Issues related to cleanliness and hygiene in the university premises.',
    priority: 'low',
  },
  {
    name: 'Vandalism',
    description: 'Concerns regarding vandalism or damage to university property.',
    priority: 'medium',
  },
  {
    name: 'Bullying',
    description: 'Reports of bullying or harassment incidents within the university.',
    priority: 'high',
  },
  {
    name: 'Academic Misconduct',
    description: 'Concerns related to academic dishonesty, such as cheating or plagiarism.',
    priority: 'medium',
  },
  {
    name: 'Property Damage',
    description: 'Issues related to damage or theft of personal or university property.',
    priority: 'high',
  },
  {
    name: 'Noise Violation',
    description: 'Complaints about excessive noise in university facilities .',
    priority: 'low',
  },
  {
    name: 'Unauthorized Access',
    description: 'Reports of unauthorized access to restricted areas or facilities.',
    priority: 'high',
  },
  {
    name: 'Academic Issues',
    description: 'Concerns related to academic performance, grading, or course-related issues.',
    priority: 'medium',
  },
];

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let facultyDoc = await FacultyCategoryModel.findOne({ facultyId });

    if (!facultyDoc) {
      facultyDoc = new FacultyCategoryModel({
        facultyId,
        facultyName,
        categories,
      });
      await facultyDoc.save();
      console.log(`✅ Created faculty categories for ${facultyName} with ${categories.length} categories.`);
    } else {
      // Add missing categories if they don't already exist
      let added = 0;
      categories.forEach((cat) => {
        const exists = facultyDoc.categories.some(
          (c) => c.name.toLowerCase() === cat.name.toLowerCase()
        );
        if (!exists) {
          facultyDoc.categories.push(cat);
          added += 1;
        }
      });
      if (added > 0) {
        await facultyDoc.save();
        console.log(`✅ Updated faculty categories for ${facultyName}; added ${added} categories.`);
      } else {
        console.log(`⚠️ Faculty categories already exist for ${facultyName}; no changes made.`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding faculty categories:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔗 Database connection closed.');
    process.exit(0);
  }
};

main();
