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
  qualifications: [user.educationQualification]
}, {
  timestamps: true
});

export const Course = mongoose.model('Course', CourseSchema);