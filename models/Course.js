import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: String,
});

export const Course = mongoose.model('Course', CourseSchema);