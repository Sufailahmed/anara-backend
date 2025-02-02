import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Volunteer } from "../models/volunteerModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { volunteerToken } from "../utils/volunteerToken.js";
import crypto from "crypto";

export const register = catchAsyncError(async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      verificationMethod,
      guardian,
      address,
      dob,
      gender,
      image,
      undertaking,
      policeVerification,
      educationQualification,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !verificationMethod ||
      !guardian ||
      !address ||
      !dob ||
      !gender ||
      !image ||
      !undertaking ||
      !policeVerification ||
      !educationQualification
    ) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    // Validate phone number format
    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+91\d{10}$/;
      return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
      return next(new ErrorHandler("Invalid phone number.", 400));
    }

    // Check if both email and phone are used together before
    const existingVolunteer = await Volunteer.findOne({
      $or: [
        { email, phone, accountVerified: true }, // Check for both email and phone
      ],
    });

    if (existingVolunteer) {
      return next(new ErrorHandler("This email and phone combination is already used.", 400));
    }

    // Check if the email alone or phone alone is already registered but not verified
    const existingEmailPhone = await Volunteer.findOne({
      $or: [
        { email, accountVerified: false },
        { phone, accountVerified: false },
      ],
    });

    if (existingEmailPhone) {
      return next(new ErrorHandler("Email or phone already exists. Use a different one.", 400));
    }

    // Create volunteer data and registration
    const volunteerData = {
      name,
      email,
      phone,
      password,
      guardian,
      address,
      dob,
      gender,
      image,
      undertaking,
      policeVerification,
      educationQualification,
    };

    const volunteer = await Volunteer.create(volunteerData);
    const verificationCode = await volunteer.generateVerificationCode();
    await volunteer.save();
    
    // Send the verification code via the selected method
    sendVerificationCode(verificationMethod, verificationCode, name, email, res);
  } catch (error) {
    next(error);
  }
});



async function sendVerificationCode(
  verificationMethod,
  verificationCode,
  name,
  email,
  res
) {
  try {
    if (verificationMethod === "email") {
      const message = generateEmailTemplate(verificationCode);
      await sendEmail({ email, subject: "Your Verification Code", message });
      res.status(200).json({
        success: true,
        message: `Verification email successfully sent to ${name}`,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid verification method. Only email is supported.",
      });
    }
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({
      success: false,
      message: "Verification code failed to send.",
    });
  }
}

function generateEmailTemplate(verificationCode) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear volunteer,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>
  `;
}

export const verifyOTP = catchAsyncError(async (req, res, next) => {
  try {
    console.log("Request body:", req.body);
    const { email, otp, phone } = req.body;

    if (!email || !otp || !phone) {
      console.log("Missing required fields:", { email, otp, phone });
      return next(new ErrorHandler("All fields are required.", 400));
    }

    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+91\d{10}$/;
      return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
      console.log("Invalid phone number:", phone);
      return next(new ErrorHandler("Invalid phone number.", 400));
    }

    const volunteerAllEntries = await Volunteer.find({
      $or: [
        { email, accountVerified: false },
        { phone, accountVerified: false },
      ],
    }).sort({ createdAt: -1 });

    console.log("Found volunteer entries:", volunteerAllEntries);

    if (!volunteerAllEntries || volunteerAllEntries.length === 0) {
      console.log("No volunteer entries found");
      return next(new ErrorHandler("No pending verification found.", 404));
    }

    let volunteer = volunteerAllEntries[0];
    console.log("Selected volunteer:", volunteer);

    // Clean up other pending entries if they exist
    if (volunteerAllEntries.length > 1) {
      console.log("Cleaning up multiple entries");
      await Volunteer.deleteMany({
        _id: { $ne: volunteer._id },
        $or: [{ phone, accountVerified: false }, { email, accountVerified: false }],
      });
    }

    console.log("Verification code comparison:", {
      provided: Number(otp),
      stored: volunteer.verificationCode,
    });

    if (volunteer.verificationCode !== Number(otp)) {
      return next(new ErrorHandler("Invalid OTP.", 400));
    }

    const currentTime = Date.now();
    const verificationCodeExpire = new Date(volunteer.verificationCodeExpire).getTime();

    console.log("Time comparison:", {
      currentTime,
      verificationCodeExpire,
      isExpired: currentTime > verificationCodeExpire,
    });

    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler("OTP has expired.", 400));
    }

    // ✅ Generate Registration Number
    if (!volunteer.regNumber) {
      const lastVolunteer = await Volunteer.findOne(
        { regNumber: { $exists: true, $ne: null } },
        {},
        { sort: { createdAt: -1 } }
      );

      let newRegNumber;
      if (lastVolunteer && lastVolunteer.regNumber) {
        const lastRegNumber = lastVolunteer.regNumber.split("/").pop(); // Extract number part
        const nextNumber = String(parseInt(lastRegNumber, 10) + 1).padStart(6, "0");
        newRegNumber = `T/ASF/FE/${nextNumber}`;
      } else {
        newRegNumber = "T/ASF/FE/000001"; // Start fresh if no previous user
      }

      volunteer.regNumber = newRegNumber;
    }

    volunteer.accountVerified = true;
    volunteer.verificationCode = null;
    volunteer.verificationCodeExpire = null;

    console.log("About to save volunteer:", volunteer);

    const savedVolunteer = await volunteer.save({ validateModifiedOnly: true });
    console.log("Volunteer saved successfully:", savedVolunteer);

    // ✅ Send Registration Number via Email
    await sendRegNumberEmail(volunteer.name, volunteer.email, volunteer.regNumber)

    volunteerToken(volunteer, 200, "Account verified successfully.", res);
  } catch (error) {
    console.error("Detailed error in verifyOTP:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler(error.message || "Internal Server Error.", 500));
  }
});
async function sendRegNumberEmail(name, email, regNumber) {
  try {
    const message = generateRegNumberEmailTemplate(name, regNumber);
    await sendEmail({ email, subject: "Your Registration Number", message });
    console.log(`Registration number email sent to ${email}`);
  } catch (error) {
    console.error("Error sending registration number email:", error);
  }
}

// Function to generate Email Template for Registration Number
function generateRegNumberEmailTemplate(name, regNumber) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Registration Successful</h2>
      <p style="font-size: 16px; color: #333;">Dear ${name},</p>
      <p style="font-size: 16px; color: #333;">Your registration has been successfully verified.</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 20px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          Registration Number: ${regNumber}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please keep this number for future reference.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>
  `;
}


export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required.", 400));
  }
  const volunteer = await Volunteer.findOne({
    email,
    accountVerified: true,
  }).select("+password");
  if (!volunteer) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  const isPasswordMatched = await volunteer.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  volunteerToken(volunteer, 200, "volunteer logged in successfully.", res);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

export const getvolunteer = catchAsyncError(async (req, res, next) => {
  const volunteer = req.volunteer;
  res.status(200).json({
    success: true,
    volunteer,
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const volunteer = await Volunteer.findOne({
    email: req.body.email,
    accountVerified: true,
  });
  if (!volunteer) {
    return next(new ErrorHandler("volunteer not found.", 404));
  }
  const resetToken = volunteer.generateResetPasswordToken();
  await volunteer.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `Your Reset Password Token is:- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it.`;

  try {
    sendEmail({
      email: volunteer.email,
      subject: "MERN AUTHENTICATION APP RESET PASSWORD",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${volunteer.email} successfully.`,
    });
  } catch (error) {
    volunteer.resetPasswordToken = undefined;
    volunteer.resetPasswordExpire = undefined;
    await Volunteer.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        error.message ? error.message : "Cannot send reset password token.",
        500
      )
    );
  }
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const volunteer = await Volunteer.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!volunteer) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired.",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password & confirm password do not match.", 400)
    );
  }

  volunteer.password = req.body.password;
  volunteer.resetPasswordToken = undefined;
  volunteer.resetPasswordExpire = undefined;
  await Volunteer.save();

  volunteerToken(volunteer, 200, "Reset Password Successfully.", res);
});