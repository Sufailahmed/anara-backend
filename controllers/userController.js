import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import nodemailer from 'nodemailer'
import { Volunteer } from "../models/volunteerModel.js";

const otpStore = new Map();

//Send email otp
export const sendEmailOTP = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required.", 400));
  }

  const user = await User.findOne({ email });

  if (user) {
    return next(new ErrorHandler("Email is already registered.", 400));
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  const otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(email, { otp, otpExpire });

  try {
    const message = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;background-color: #f9f9f9;padding: 0;margin: 0;}
          .email-container {max-width: 600px;margin: 20px auto;padding: 20px;background-color: #ffffff;border-radius: 8px;box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);}
          .header {text-align: center;color: #4caf50;}
          .otp-box {font-size: 32px;font-weight: bold;color: #ffffff;background-color: #4caf50;padding: 10px 20px;border-radius: 8px;text-align: center;display: inline-block;margin: 20px auto;}
          p {font-size: 16px;color: #333;line-height: 1.6;}
          .footer {font-size: 12px;color: #aaa;text-align: center;margin-top: 20px;}
        </style>
      </head>
      <body>
        <div class="email-container">
          <h1 class="header">Your OTP for Email Verification</h1>
          <p>Dear User,</p>
          <p>Please use the following One-Time Password (OTP) to verify your email:</p>
          <div class="otp-box">${otp}</div>
          <p>This code is valid for the next 5 minutes. Please do not share this code with anyone.</p>
          <p>If you did not request this, please ignore this email.</p>
          <div class="footer">
            <p>Thank you</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
    await sendEmail({ email, subject: "Email Verification OTP", message });
    res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to send OTP.", 500));
  }
});





//Verify otp
export const verifyEmailOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorHandler("Email and OTP are required.", 400));
  }

  const storedOtpData = otpStore.get(email);
  if (!storedOtpData) {
    return next(new ErrorHandler("OTP not found or expired.", 400));
  }
  const { otp: storedOtp, otpExpire } = storedOtpData;

  if (Date.now() > otpExpire) {
    otpStore.delete(email);
    return next(new ErrorHandler("OTP Expired.", 400));
  }

  if (parseInt(otp) !== storedOtp) {
    return next(new ErrorHandler("Invalid OTP.", 400));
  }

  // Mark OTP as verified
  otpStore.set(email, { verified: true });
  res.status(200).json({
    success: true,
    message: "Email verified successfully.",
  });
});





//Generate temporary register number
// export const generateTemporaryRegNumber = catchAsyncError(async (req, res, next) => {
//   const { email } = req.body;

//   if (!email) {
//     return next(new ErrorHandler("Email is required.", 400));
//   }

//   // Check if the email has been verified
//   const storedOtpData = otpStore.get(email);

//   if (!storedOtpData || !storedOtpData.verified) {
//     return next(new ErrorHandler("Email not verified. Please verify your email first.", 400));
//   }

//   // Check if tempRegNumber already exists for the email
//   let tempReg = await userTempReg.findOne({ email });

//   if (!tempReg) {
//     // Generate new unique Temporary Registration Number
//     const count = await userTempReg.countDocuments(); // Get count of existing registrations
//     const tempRegNumber = `T/ASF/CANDIDATE/${String(count + 1).padStart(5, '0')}`;

//     // Save to DB
//     tempReg = await userTempReg.create({ email, tempRegNumber });
//   }

//   const message = `
//     <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
//       <h2 style="color: #333;">Temporary Registration Number</h2>
//       <p>Dear Candidate,</p>
//       <p>Your Temporary Registration Number is:</p>
//       <h2 style="color: #4caf50; text-align: center;">${tempReg.tempRegNumber}</h2>
//       <p>Please use this temporary registration number to proceed with further verification.</p>
//       <p>Thank you.</p>
//     </div>
//   `;

//   try {
//     await sendEmail({
//       email,
//       subject: "Your Temporary Registration Number",
//       message,
//     });
//   } catch (error) {
//     return next(new ErrorHandler("Failed to send Temporary Registration Number.", 500));
//   }
//   res.status(200).json({
//     success: true,
//     message: "Temporary Registration Number assigned successfully.",
//     tempRegNumber: tempReg.tempRegNumber,
//   });
// });





//Get all volunteers for the dropdown
export const getVolunteersDropdown = catchAsyncError(async (req, res, next) => {
  try {
    const volunteers = await Volunteer.find({}, "name");
    if (!volunteers || volunteers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No volunteers found.",
      });
    }
    res.status(200).json({
      success: true,
      volunteers,
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to fetch volunteers.", 500));
  }
});





//Register
export const register = catchAsyncError(async (req, res, next) => {
  const { 
    name, email, phone, password, guardian, address, currentAddress, dob, gender, 
    bankAccNumber, bankName, ifsc, volunteerName, pwdCategory, entrepreneurshipInterest 
  } = req.body;

  try {
    if (!name || !email || !phone || !password || !guardian || !address || !currentAddress || !dob || !gender || !bankAccNumber || !bankName || !ifsc || !volunteerName || pwdCategory === undefined || entrepreneurshipInterest === undefined) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    if (!req.files || !req.files.image || !req.files.undertaking || !req.files.policeVerification || !req.files.educationQualification || !req.files.bankPassbook) {
      return next(new ErrorHandler("All required documents must be uploaded.", 400));
    }

    if (pwdCategory === "Yes" && !req.files.pwdCertificate) {
      return next(new ErrorHandler("PWD Certificate is required.", 400));
    }
    
    if (entrepreneurshipInterest === "Yes" && !req.files.bplCertificate) {
      return next(new ErrorHandler("BPL/marginalized category certificate is required.", 400));
    }

    const emailExists = await User.findOne({ email });
    const phoneExists = await User.findOne({ phone });

    if (emailExists || phoneExists) {
      return next(new ErrorHandler("Email or phone is already registered.", 400));
    }

    // ✅ Ensure regNumber is generated before creating the user
    const count = await User.countDocuments();
    const regNumber = `ASF/CANDIDATE/${String(count + 1).padStart(5, '0')}`;

    // ✅ Debugging: Check if regNumber is null
    console.log("Generated regNumber:", regNumber);

    if (!regNumber) {
      return next(new ErrorHandler("Failed to generate registration number.", 500));
    }
    const validBankAccNumber = bankAccNumber && bankAccNumber.trim() !== "" ? bankAccNumber : "Not Provided";

 
    // ✅ Now creating user with permanent regNumber
    const user = await User.create({
      name, email, phone, password, guardian, address, currentAddress, dob, gender, 
      bankAccNumber:validBankAccNumber, bankName, ifsc, volunteerName, 
      pwdCategory, entrepreneurshipInterest,
      image: req.files.image[0].path,
      undertaking: req.files.undertaking[0].path,
      policeVerification: req.files.policeVerification[0].path,
      educationQualification: req.files.educationQualification[0].path,
      bankPassbook: req.files.bankPassbook[0].path,
      pwdCertificate: pwdCategory === "Yes" ? req.files.pwdCertificate[0].path : null,
      bplCertificate: entrepreneurshipInterest === "Yes" ? req.files.bplCertificate[0].path : null,
      accountVerified: true,
      regNumber, // ✅ Assign regNumber before saving
    });

    console.log("User created with regNumber:", user.regNumber);

    // Send registration confirmation email to the user
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "hasanulbanna2255@gmail.com",
          pass: "wflv nsjo ofba rvov",
        },
      });

      const mailOptions = {
        from: "hasanulbanna2255@gmail.com",
        to: email,
        subject: "Welcome to Anara - Your Registration is Successful!",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #007bff; text-align: center;">🌟 Welcome to Anara, ${name}! 🌟</h2>
            <p style="font-size: 16px;">Dear ${name},</p>
            <p>We are delighted to have you on board! Your registration with Anara has been successfully completed. Below are your details:</p>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Registration Number:</strong> ${regNumber}</p>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Thank you for choosing Anara! We look forward to having you as part of our community.</p>
            <hr style="border: none; border-top: 1px solid #ddd;">
            <p style="text-align: center; font-size: 12px; color: #888;">This is an automated email, please do not reply.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Registration confirmation email sent to:", email);
    } catch (error) {
      console.log("Error sending registration email:", error);
    }
  
    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error, 500));
  }
});








//Approve email
// export const approveEmail = async (req, res) => {
//   try {
//     const { email, approved } = req.query;
//     console.log(`User approval for ${email}: ${approved}`);

//     if (approved === "true") {
//       const tempRegEntry = await User.findOne({ email });

//       if (!tempRegEntry) {
//         return res.status(404).json({ success: false, message: "Temporary Registration Number not found." });
//       }

//       // Remove 'T/' from the beginning and keep the rest the same
//       const newRegNumber = tempRegEntry.tempRegNumber.replace(/^T\//, "");

//       // Update the database with the new Registration Number
//       tempRegEntry.tempRegNumber = newRegNumber;
//       await tempRegEntry.save();
//       try {
//         const transporter = nodemailer.createTransport({
//           service: "gmail",
//           auth: {
//             user: "hasanulbanna2255@gmail.com",
//             pass: "wflv nsjo ofba rvov",
//           },
//         });
//         const mailOptions = {
//           from: "hasanulbanna2255@gmail.com",
//           to: email,
//           subject: "New Registration Number",
//           html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
//         <div style="background-color: #4caf50; padding: 15px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px;">
//           <h2 style="color: #fff; margin: 0;">Welcome!</h2>
//         </div>
//         <div style="padding: 20px; text-align: center;">
//           <p style="font-size: 18px; color: #333;">🎉 Congratulations!</p>
//           <p style="font-size: 16px; color: #555;">Your new registration number is:</p>
//           <h2 style="color: #4caf50; font-size: 28px; background: #f0f0f0; padding: 10px; display: inline-block; border-radius: 5px;">
//             ${newRegNumber}
//           </h2>
//           <p style="font-size: 16px; color: #555;">Keep this number safe for future reference.</p>
//         </div>
//         <hr style="border: none; border-top: 1px solid #ddd;">
//       </div>
//     `,
//         };
//         await transporter.sendMail(mailOptions);
//         console.log("New regNumber send to:", email);
//       } catch (error) {
//         console.log("Error sending email:", error);
//       }
//       console.log(`Updated Registration Number: ${newRegNumber}`);
//     }
//     res.send(`<h1>Done ✅ </h1>`);
//   } catch (error) {
//     console.error("Error approving email:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };





//Login
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required.", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !user.accountVerified) {
    return next(new ErrorHandler("Account not verified. Please verify your email first.", 400));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  sendToken(user, 200, "User logged in successfully.", res);
});





//Logout
export const logout = catchAsyncError(async (req, res, next) => {
  res.status(200).cookie("token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
  }).json({
    success: true,
    message: "Logged out successfully.",
  });
});





//Forgot Password
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email, accountVerified: true });

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hi,</p>
      <p>We received a request to reset your password. You can reset it using the link below:</p>
      <p><strong>Reset Password Link:</strong></p>
      <p style="word-break: break-all; color: #007bff;">${resetPasswordUrl}</p>
      <p>If you did not request a password reset, please ignore this email if you have concerns.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>Best regards,<br>Anara Team</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset Password",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Cannot send reset password token.", 500));
  }
});





//Reset Password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Reset password token is invalid or has expired.", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password and confirm password do not match.", 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, "Reset Password Successfully.", res);
});





//Get User
export const getUser = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});
