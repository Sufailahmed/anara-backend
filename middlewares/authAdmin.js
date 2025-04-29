import { Admin } from "../models/adminModel.js";
import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";

export const isAdminAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Admin is not authenticated.", 401));
  }
  const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);
  req.admin = await Admin.findById(decoded.id);
  next();
});