import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FacultyCategoryModel from '../models/FacultyCategory.js';

dotenv.config();

const facultyArtsId = '6962f752d9ccce320f94f93d';
const facultyArtsName = 'Faculty of Arts And Social Sciences';

const facultyLanguagesId = '6962fb63afb13cabf22f3eb1';
const facultyLanguagesName = 'Faculty of Languages and Linguistics';

const artsCategories = [
  {
    name: 'Cleanliness',
    description: 'Issues related to cleanliness and hygiene in faculty premises.',
    priority: 'low',
  },
  {
    name: 'Vandalism',
    description: 'Concerns regarding vandalism or damage to faculty property.',
    priority: 'medium',
  },
  {
    name: 'Bullying',
    description: 'Reports of bullying or harassment incidents within the faculty.',
    priority: 'high',
  },
  {
    name: 'Library Resources',
    description: 'Issues related to library materials, access, or facilities.',
    priority: 'medium',
  },
  {
    name: 'Research Facilities',
    description: 'Concerns about research spaces, equipment, or resources.',
    priority: 'medium',
  },
  {
    name: 'Cultural Events',
    description: 'Issues or suggestions regarding cultural programs and events.',
    priority: 'low',
  },
  {
    name: 'Seminar Rooms',
    description: 'Problems with seminar room bookings, equipment, or conditions.',
    priority: 'medium',
  },
  {
    name: 'Property Damage',
    description: 'Issues related to damage or theft of personal or faculty property.',
    priority: 'high',
  },
];

const languagesCategories = [
  {
    name: 'Cleanliness',
    description: 'Issues related to cleanliness and hygiene in faculty premises.',
    priority: 'low',
  },
  {
    name: 'Audio Equipment',
    description: 'Problems with audio/language lab equipment or facilities.',
    priority: 'high',
  },
  {
    name: 'Language Lab',
    description: 'Issues related to language laboratory facilities and resources.',
    priority: 'high',
  },
  {
    name: 'Bullying',
    description: 'Reports of bullying or harassment incidents within the faculty.',
    priority: 'high',
  },
  {
    name: 'Translation Services',
    description: 'Concerns about translation or interpretation resources.',
    priority: 'medium',
  },
  {
    name: 'Study Spaces',
    description: 'Issues with study areas, seating, or learning environments.',
    priority: 'medium',
  },
  {
    name: 'Cafe Services',
    description: 'Complaints or feedback about cafe facilities and services.',
    priority: 'low',
  },
  {
    name: 'Property Damage',
    description: 'Issues related to damage or theft of personal or faculty property.',
    priority: 'high',
  },
];

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Database connected');

    // Seed Faculty of Arts And Social Sciences
    let facultyArtsDoc = await FacultyCategoryModel.findOne({ facultyId: facultyArtsId });

    if (!facultyArtsDoc) {
      facultyArtsDoc = new FacultyCategoryModel({
        facultyId: facultyArtsId,
        facultyName: facultyArtsName,
        categories: artsCategories,
      });
      await facultyArtsDoc.save();
      console.log(`✅ Created faculty categories for ${facultyArtsName} with ${artsCategories.length} categories.`);
    } else {
      let added = 0;
      artsCategories.forEach((cat) => {
        const exists = facultyArtsDoc.categories.some(
          (c) => c.name.toLowerCase() === cat.name.toLowerCase()
        );
        if (!exists) {
          facultyArtsDoc.categories.push(cat);
          added += 1;
        }
      });
      if (added > 0) {
        await facultyArtsDoc.save();
        console.log(`✅ Updated faculty categories for ${facultyArtsName}; added ${added} categories.`);
      } else {
        console.log(`⚠️ Faculty categories already exist for ${facultyArtsName}; no changes made.`);
      }
    }

    // Seed Faculty of Languages and Linguistics
    let facultyLanguagesDoc = await FacultyCategoryModel.findOne({ facultyId: facultyLanguagesId });

    if (!facultyLanguagesDoc) {
      facultyLanguagesDoc = new FacultyCategoryModel({
        facultyId: facultyLanguagesId,
        facultyName: facultyLanguagesName,
        categories: languagesCategories,
      });
      await facultyLanguagesDoc.save();
      console.log(`✅ Created faculty categories for ${facultyLanguagesName} with ${languagesCategories.length} categories.`);
    } else {
      let added = 0;
      languagesCategories.forEach((cat) => {
        const exists = facultyLanguagesDoc.categories.some(
          (c) => c.name.toLowerCase() === cat.name.toLowerCase()
        );
        if (!exists) {
          facultyLanguagesDoc.categories.push(cat);
          added += 1;
        }
      });
      if (added > 0) {
        await facultyLanguagesDoc.save();
        console.log(`✅ Updated faculty categories for ${facultyLanguagesName}; added ${added} categories.`);
      } else {
        console.log(`⚠️ Faculty categories already exist for ${facultyLanguagesName}; no changes made.`);
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
