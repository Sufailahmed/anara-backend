import express from "express";
import {
  register,
  login,
  logout,
  getadmin,
  forgotPassword,
  resetPassword,
  getAllVolunteersAndUsers
} from "../controllers/adminController.js";
import { isAdminAuthenticated } from "../middlewares/authAdmin.js";

const router = express.Router();

router.post("/register", register);  // connect to add admin button 
router.post("/login", login); // admin login page
router.get("/logout", isAdminAuthenticated, logout); // logout button
router.get("/me", isAdminAuthenticated, getadmin);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.get("/volunteers-and-users", getAllVolunteersAndUsers)

export default router;