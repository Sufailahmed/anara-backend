import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { Volunteer } from '../models/volunteerModel.js';

export const isVolunteerAuthenticated = catchAsyncError(async (req, res, next) => {
    let token = req.cookies.token; 
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1]; // Extract token from 'Bearer token'
      }
    if (!token) {
        return next(new ErrorHandler("Volunteer is not authenticated.", 400));
    }
    const decoded = jwt.verify(token, process.env.VOLUNTEER_SECRET_KEY);
    req.volunteer = await Volunteer.findById(decoded.id);
    next();
});

