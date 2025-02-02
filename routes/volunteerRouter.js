import express from "express";
import {
  register,
  verifyOTP,
  login,
  logout,
  getvolunteer,
  forgotPassword,
  resetPassword,
} from "../controllers/volunteerController.js";
import { isVolunteerAuthenticated } from "../middlewares/authVolunteer.js";

const router = express.Router();

router.post("/register", register); // register a new volunteer
router.post("/otp-verification", verifyOTP); // verify OTP
router.post("/login", login); // login a volunteer
router.get("/logout", isVolunteerAuthenticated, logout); // logout a volunteer
router.get("/me", isVolunteerAuthenticated, getvolunteer);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);

export default router;