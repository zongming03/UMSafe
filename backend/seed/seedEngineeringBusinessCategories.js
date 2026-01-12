import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FacultyCategoryModel from '../models/FacultyCategory.js';

dotenv.config();

const facultyEngineeringId = '6962f752d9ccce320f94f8bd';
const facultyEngineeringName = 'Faculty of Engineering';

const facultyBusinessId = '6962f752d9ccce320f94f905';
const facultyBusinessName = 'Faculty of Business and Economics';

const engineeringCategories = [
  {
    name: 'Cleanliness',
    description: 'Issues related to cleanliness and hygiene in faculty premises.',
    priority: 'low',
  },
  {
    name: 'Lab Equipment',
    description: 'Problems with laboratory equipment, tools, or machinery.',
    priority: 'high',
  },
  {
    name: 'Safety Hazards',
    description: 'Concerns about safety risks in labs, workshops, or engineering spaces.',
    priority: 'high',
  },
  {
    name: 'Vandalism',
    description: 'Concerns regarding vandalism or damage to faculty property.',
    priority: 'medium',
  },
  {
    name: 'Workshop Facilities',
    description: 'Issues related to workshop spaces, tools, or access.',
    priority: 'medium',
  },
  {
    name: 'CAD Lab Issues',
    description: 'Problems with computer-aided design lab equipment or software.',
    priority: 'high',
  },
  {
    name: 'Project Spaces',
    description: 'Concerns about final year project workspaces or resources.',
    priority: 'medium',
  },
  {
    name: 'Property Damage',
    description: 'Issues related to damage or theft of personal or faculty property.',
    priority: 'high',
  },
  {
    name: 'Bullying',
    description: 'Reports of bullying or harassment incidents within the faculty.',
    priority: 'high',
  },
];

const businessCategories = [
  {
    name: 'Cleanliness',
    description: 'Issues related to cleanliness and hygiene in faculty premises.',
    priority: 'low',
  },
  {
    name: 'Computer Lab',
    description: 'Problems with computer lab facilities, equipment, or software.',
    priority: 'medium',
  },
  {
    name: 'Lecture Halls',
    description: 'Issues with lecture hall facilities, projectors, or seating.',
    priority: 'medium',
  },
  {
    name: 'Bullying',
    description: 'Reports of bullying or harassment incidents within the faculty.',
    priority: 'high',
  },
  {
    name: 'Seminar Rooms',
    description: 'Problems with seminar room bookings, equipment, or conditions.',
    priority: 'medium',
  },
  {
    name: 'Study Areas',
    description: 'Concerns about student lounge, study spaces, or group discussion areas.',
    priority: 'low',
  },
  {
    name: 'Academic Misconduct',
    description: 'Concerns related to academic dishonesty, such as cheating or plagiarism.',
    priority: 'high',
  },
  {
    name: 'Vandalism',
    description: 'Concerns regarding vandalism or damage to faculty property.',
    priority: 'medium',
  },
  {
    name: 'Cafe Services',
    description: 'Complaints or feedback about cafe facilities and services.',
    priority: 'low',
  },
];

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Database connected');

    // Seed Faculty of Engineering
    let facultyEngineeringDoc = await FacultyCategoryModel.findOne({ facultyId: facultyEngineeringId });

    if (!facultyEngineeringDoc) {
      facultyEngineeringDoc = new FacultyCategoryModel({
        facultyId: facultyEngineeringId,
        facultyName: facultyEngineeringName,
        categories: engineeringCategories,
      });
      await facultyEngineeringDoc.save();
      console.log(`✅ Created faculty categories for ${facultyEngineeringName} with ${engineeringCategories.length} categories.`);
    } else {
      let added = 0;
      engineeringCategories.forEach((cat) => {
        const exists = facultyEngineeringDoc.categories.some(
          (c) => c.name.toLowerCase() === cat.name.toLowerCase()
        );
        if (!exists) {
          facultyEngineeringDoc.categories.push(cat);
          added += 1;
        }
      });
      if (added > 0) {
        await facultyEngineeringDoc.save();
        console.log(`✅ Updated faculty categories for ${facultyEngineeringName}; added ${added} categories.`);
      } else {
        console.log(`⚠️ Faculty categories already exist for ${facultyEngineeringName}; no changes made.`);
      }
    }

    // Seed Faculty of Business and Economics
    let facultyBusinessDoc = await FacultyCategoryModel.findOne({ facultyId: facultyBusinessId });

    if (!facultyBusinessDoc) {
      facultyBusinessDoc = new FacultyCategoryModel({
        facultyId: facultyBusinessId,
        facultyName: facultyBusinessName,
        categories: businessCategories,
      });
      await facultyBusinessDoc.save();
      console.log(`✅ Created faculty categories for ${facultyBusinessName} with ${businessCategories.length} categories.`);
    } else {
      let added = 0;
      businessCategories.forEach((cat) => {
        const exists = facultyBusinessDoc.categories.some(
          (c) => c.name.toLowerCase() === cat.name.toLowerCase()
        );
        if (!exists) {
          facultyBusinessDoc.categories.push(cat);
          added += 1;
        }
      });
      if (added > 0) {
        await facultyBusinessDoc.save();
        console.log(`✅ Updated faculty categories for ${facultyBusinessName}; added ${added} categories.`);
      } else {
        console.log(`⚠️ Faculty categories already exist for ${facultyBusinessName}; no changes made.`);
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
