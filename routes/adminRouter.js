import express from "express";
import {
  register,
  login,
  logout,
  getadmin,
  forgotPassword,
  resetPassword,
  CountVolunteersAndUsers,
  getAllVolunteers,
  getAllUsers,
} from "../controllers/adminController.js";
import { isAdminAuthenticated } from "../middlewares/authAdmin.js";

const router = express.Router();

router.post("/register", register);  // Admin register

router.post("/login", login); // admin login page

router.get("/logout", isAdminAuthenticated, logout); // logout button

router.get("/me", isAdminAuthenticated, getadmin); // get admin data

router.post("/password/forgot", forgotPassword); //Admin forgot password

router.put("/password/reset/:token", resetPassword); //Admin reset password

router.get("/volunteers",isAdminAuthenticated, getAllVolunteers) //Get all volunteers and users

router.get("/users",isAdminAuthenticated, getAllUsers) //Get all volunteers and users

router.get("/count",isAdminAuthenticated, CountVolunteersAndUsers) //Count of volunteer and users

export default router;