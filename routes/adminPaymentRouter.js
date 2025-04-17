// import express from "express";
// import {
//   getAllPaymentRequests,
//   approvePaymentRequest,
//   processPayment,
//   verifyPayment,
//   rejectPaymentRequest,
//   getPaymentStats
// } from "../controllers/adminPaymentController.js";
// import { isAdminAuthenticated } from "../middlewares/authAdmin.js";

// const router = express.Router();

// router.get("/all", isAdminAuthenticated, getAllPaymentRequests); // Get all payment requests 

// router.post("/process/:requestId", isAdminAuthenticated, processPayment); // Process payment

// router.post("/approve/:requestId", isAdminAuthenticated, approvePaymentRequest); // Approve payment request

// router.post("/verify", isAdminAuthenticated, verifyPayment); // Verify payment

// router.post("/reject/:requestId", isAdminAuthenticated, rejectPaymentRequest); // Reject payment request

// router.get("/status", isAdminAuthenticated, getPaymentStats); // Get payment stats

// export default router;