import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import volunteerRouter from "./routes/volunteerRouter.js";
import adminPaymentRouter from "./routes/adminPaymentRouter.js"
import adminRouter from "./routes/adminRouter.js";
import { removeUnverifiedAccounts } from "./automation/removeUnverifiedAccounts.js";
import path from "path";
import { fileURLToPath } from "url";
import volunteerPaymentRouter from "./routes/volunteerPaymentRouter.js";

export const app = express();
config({ path: "./config.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  cors({
    origin: "https://digi-colab-roan.vercel.app", // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies and authorization headers
  })
);

// Optional: Handle preflight requests manually
app.options("*", cors());


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/volunteer", volunteerRouter);
app.use("/api/v1/admin", adminRouter);
app.use('/api/v1/payment-requests', volunteerPaymentRouter);
app.use('/api/v1/admin/payment-requests', adminPaymentRouter);

removeUnverifiedAccounts();
connection();

app.use(errorMiddleware);