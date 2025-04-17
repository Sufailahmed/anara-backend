// import ErrorHandler from "../middlewares/error.js";
// import { catchAsyncError } from "../middlewares/catchAsyncError.js";
// import { PaymentRequest } from "../models/paymentModel.js";
// import Razorpay from "razorpay";
// import crypto from "crypto";
// import { Volunteer } from "../models/volunteerModel.js";

// // Initialize Razorpay
// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_fnksr3F0Q4J7nS",
//     key_secret: process.env.RAZORPAY_KEY_SECRET || "jsJsuYifJn3u44DKdXEqmqSI",
// });
// console.log("Razorpay secret loaded:", !!process.env.RAZORPAY_KEY_SECRET);


// // Get all payment requests for admin dashboard
// export const getAllPaymentRequests = catchAsyncError(async (req, res, next) => {
//   const admin = req.admin;
  
//   if (!admin) {
//     return next(new ErrorHandler("Unauthorized. Please login again.", 401));
//   }
  
//   const paymentRequests = await PaymentRequest.find()
//     .populate("volunteer", "name email phone tempRegNumber bankAccNumber bankName ifsc")
//     .populate("approvals.admin", "name email")
//     .sort({ requestDate: -1 });
  
//   res.status(200).json({
//     success: true,
//     paymentRequests
//   });
// });

// // Approve a payment request
// export const approvePaymentRequest = catchAsyncError(async (req, res, next) => {
//   const admin = req.admin;
//   const { requestId } = req.params;
  
//   if (!admin) {
//     return next(new ErrorHandler("Unauthorized. Please login again.", 401));
//   }
  
//   const paymentRequest = await PaymentRequest.findById(requestId);
  
//   if (!paymentRequest) {
//     return next(new ErrorHandler("Payment request not found.", 404));
//   }
  
//   // Check if admin has already approved
//   const alreadyApproved = paymentRequest.approvals.some(
//     approval => approval.admin.toString() === admin._id.toString()
//   );
  
//   if (alreadyApproved) {
//     return next(new ErrorHandler("You have already approved this request.", 400));
//   }
  
//   // Add admin's approval
//   paymentRequest.approvals.push({ admin: admin._id });
  
//   // Check if we have at least 3 approvals
//   if (paymentRequest.approvals.length >= 3) {
//     paymentRequest.status = "approved";
//   }
  
//   await paymentRequest.save();
  
//   res.status(200).json({
//     success: true,
//     message: "Payment request approved successfully.",
//     paymentRequest
//   });
// });

// // Process payment after approval
// export const processPayment = catchAsyncError(async (req, res, next) => {
//   const admin = req.admin;
//   const { requestId } = req.params;
  
//   if (!admin) {
//     return next(new ErrorHandler("Unauthorized. Please login again.", 401));
//   }
  
//   const paymentRequest = await PaymentRequest.findById(requestId)
//     .populate("volunteer", "name email phone tempRegNumber bankAccNumber bankName ifsc");
  
//   if (!paymentRequest) {
//     return next(new ErrorHandler("Payment request not found.", 404));
//   }
  
//   if (paymentRequest.status !== "approved") {
//     return next(new ErrorHandler("Payment request is not approved yet.", 400));
//   }
  
//   // Create Razorpay order
//   const order = await razorpay.orders.create({
//     amount: paymentRequest.amount * 100, // amount in paise
//     currency: "INR",
//     receipt: `receipt_${paymentRequest._id}`,
//     notes: {
//       volunteerRegNumber: paymentRequest.volunteerRegNumber,
//       userCount: paymentRequest.userCount
//     }
//   });
  
//   // Update payment request with order details
//   paymentRequest.razorpayOrderId = order.id;
//   await paymentRequest.save();
  
//   res.status(200).json({
//     success: true,
//     order,
//     paymentRequest,
//     key_id: process.env.RAZORPAY_KEY_ID
//   });
// });

// // Verify payment and update status
// export const verifyPayment = catchAsyncError(async (req, res, next) => {
//   const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

//   const secret = process.env.RAZORPAY_KEY_SECRET || "jsJsuYifJn3u44DKdXEqmqSI";

//   if (!secret) {
//     return next(new ErrorHandler("Razorpay secret key is not defined.", 500));
//   }

//   const generatedSignature = crypto
//     .createHmac("sha256", secret)
//     .update(`${razorpayOrderId}|${razorpayPaymentId}`)
//     .digest("hex");

//   if (generatedSignature !== signature) {
//     return next(new ErrorHandler("Payment verification failed.", 400));
//   }

//   const paymentRequest = await PaymentRequest.findOne({ razorpayOrderId });

//   if (!paymentRequest) {
//     return next(new ErrorHandler("Payment request not found.", 404));
//   }

//   paymentRequest.razorpayPaymentId = razorpayPaymentId;
//   paymentRequest.status = "paid";
//   paymentRequest.paymentDate = Date.now();
//   await paymentRequest.save();

//   res.status(200).json({
//     success: true,
//     message: "Payment processed successfully.",
//     paymentRequest,
//   });
// });


// // Reject a payment request
// export const rejectPaymentRequest = catchAsyncError(async (req, res, next) => {
//   const admin = req.admin;
//   const { requestId } = req.params;
//   const { reason } = req.body;
  
//   if (!admin) {
//     return next(new ErrorHandler("Unauthorized. Please login again.", 401));
//   }
  
//   const paymentRequest = await PaymentRequest.findById(requestId);
  
//   if (!paymentRequest) {
//     return next(new ErrorHandler("Payment request not found.", 404));
//   }
  
//   paymentRequest.status = "rejected";
//   paymentRequest.rejectionReason = reason || "No reason provided";
//   await paymentRequest.save();
  
//   res.status(200).json({
//     success: true,
//     message: "Payment request rejected successfully.",
//     paymentRequest
//   });
// });

// // Get payment statistics for admin dashboard
// export const getPaymentStats = catchAsyncError(async (req, res, next) => {
//   const admin = req.admin;
  
//   if (!admin) {
//     return next(new ErrorHandler("Unauthorized. Please login again.", 401));
//   }
  
//   const totalRequests = await PaymentRequest.countDocuments();
//   const pendingRequests = await PaymentRequest.countDocuments({ status: "pending" });
//   const approvedRequests = await PaymentRequest.countDocuments({ status: "approved" });
//   const paidRequests = await PaymentRequest.countDocuments({ status: "paid" });
//   const rejectedRequests = await PaymentRequest.countDocuments({ status: "rejected" });
  
//   // Calculate total amount paid
//   const paidPayments = await PaymentRequest.find({ status: "paid" });
//   const totalAmountPaid = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
//   res.status(200).json({
//     success: true,
//     stats: {
//       totalRequests,
//       pendingRequests,
//       approvedRequests,
//       paidRequests,
//       rejectedRequests,
//       totalAmountPaid
//     }
//   });
// });