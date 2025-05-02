import mongoose from "mongoose";

const letterHeadSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, "Subject is required"]
  },
  body_text: {
    type: String,
    required: [true, "Body text is required"]
  },
  image_id: {
    type: String,
    ref: 'Signature', // or another image model you use
    required: false
  },
  file_link: {
    type: String,
    required: [true, "File link is required"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const LetterHead = mongoose.model("LetterHead", letterHeadSchema);
