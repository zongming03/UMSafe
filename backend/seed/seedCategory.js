import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CategoryModel from '../models/Category.js';

dotenv.config();

const categories =[
{
    name:'Cleanliness',
    description:"Issues related to cleanliness and hygiene in the university premises.",
    priority: "low"
},
{
    name:'Vandalism',
    description:"Concerns regarding vandalism or damage to university property.",
    priority: "medium"
},
{
    name:'Bullying',
    description:"Reports of bullying or harassment incidents within the university.",
    priority: "high"
},
{
    name:'Academic Misconduct',
    description:"Concerns related to academic dishonesty, such as cheating or plagiarism.",
    priority: "medium"
},
{
    name:'Property Damage',
    description:"Issues related to damage or theft of personal or university property.",
    priority: "high"
},
{
    name:'Noise Violation',
    description:"Complaints about excessive noise in university facilities .",
    priority: "low"
},
{
    name:'Unauthorized Access',
    description:"Reports of unauthorized access to restricted areas or facilities.",
    priority: "high"
},
{
    name:'Academic Issues',
    description:"Concerns related to academic performance, grading, or course-related issues.",
    priority: "medium"
}
];

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    for (const category of categories) {
        const existingCategory = await CategoryModel.findOne({ name: category.name });
        if (!existingCategory) {
            const newCategory = new CategoryModel(category);
            await newCategory.save();
            console.log(`✅ Category "${category.name}" added successfully.`);
        }
        else {
            console.log(`⚠️ Category "${category.name}" already exists.`);
        }
    }
    } catch (error) {
    console.error('❌ Error adding categories:', error);
    } finally {
    mongoose.connection.close();
    console.log('🔗 Database connection closed.')
    process.exit(0);
    }

};

main();