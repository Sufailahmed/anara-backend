// import ErrorHandler from "../middlewares/error.js";
// import { catchAsyncError } from "../middlewares/catchAsyncError.js";
// import { PaymentRequest } from "../models/paymentModel.js";
// import { User } from "../models/userModel.js";
// import Razorpay from "razorpay";
// import crypto from "crypto";

// // Initialize Razorpay
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_fnksr3F0Q4J7nS",
//   key_secret: process.env.RAZORPAY_KEY_SECRET || "jsJsuYifJn3u44DKdXEqmqSI",
// });
// console.log("Razorpay secret loaded:", !!process.env.RAZORPAY_KEY_SECRET);


// // Create a payment request
// export const requestPayment = catchAsyncError(async (req, res, next) => {
//   const volunteer = req.volunteer;

//   if (!volunteer) {
//     return next(new ErrorHandler("Unauthorized. Please login again.", 401));
//   }
  
//   // Check for existing pending request
//   const existingRequest = await PaymentRequest.findOne({
//     volunteer: volunteer._id,
//     status: "pending"
//   });
  
//   if (existingRequest) {
//     return next(new ErrorHandler("You already have a pending payment request.", 400));
//   }

//   // Count users under this volunteer
//   const userCount = await User.countDocuments({ 
//     volunteerRegNum: volunteer.tempRegNumber,
//     accountVerified: true
//   });
  
//     // ✅ Add this condition to allow request only for 50 or more users
//     if (userCount < 50) {
//       return next(new ErrorHandler("You need at least 50 verified users to request payment.", 400));
//     }
  
//     // Calculate amount based on user count
//     let amount = 50;
//     if (userCount > 200) {
//       amount = 100;
//     } else if (userCount > 50) {
//       amount = 75;
//     }      
  
//   // Create payment request
//   const paymentRequest = await PaymentRequest.create({
//     volunteer: volunteer._id,
//     volunteerRegNumber: volunteer.tempRegNumber,
//     userCount,
//     amount
//   });
  
//   res.status(201).json({
//     success: true,
//     message: "Payment request created successfully.",
//     paymentRequest
//   });
// });

// // Get volunteer's payment requests
// export const getVolunteerPaymentRequests = catchAsyncError(async (req, res, next) => {
//   const volunteer = req.volunteer;
  
//   if (!volunteer) {
//     return next(new ErrorHandler("Unauthorized. Please login again.", 401));
//   }
  
//   const paymentRequests = await PaymentRequest.find({
//     volunteer: volunteer._id
//   }).sort({ requestDate: -1 });
  
//   res.status(200).json({
//     success: true,
//     paymentRequests
//   });
// });