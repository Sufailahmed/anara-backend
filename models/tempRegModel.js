import mongoose from "mongoose";

const tempRegSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  tempRegNumber: { type: String, required: true, unique: true },
});

export const TempReg = mongoose.model("TempReg", tempRegSchema);
