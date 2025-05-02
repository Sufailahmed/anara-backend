import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Course title is required"],
  },
  description: {
    type: String,
    required: [true, "Course description is required"],
  },
  image: {
    type: String,
    required: [true, "Course image is required"],
  },
  qualifications: {
    type: [String],  // Array of qualifications allowed to access this course
    required: true,
  }
}, {
  timestamps: true
});

export const Course = mongoose.model('Course', CourseSchema);
