import express, { Request, Response, NextFunction, Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from "./routes/auth.routes";
import usersRoute from "./routes/users.routes";
import { createConnection } from "mysql2";
import cors from "cors";
import { createError } from "./utils/error"; // Assuming this exists in utils folder
import hotelRoutes from "./routes/hotels.routes";
import reservationRoutes from "./routes/reservations.route";
import { verifyToken } from "./middleware/auth.middleware";
import reviewRoutes from "./routes/reviews.routes";
import paymentRoutes from "./routes/payment.routes";
import fs from "fs";
import { all } from "axios";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

const caCertPath = process.env.CA_CERTIFICATE_PATH;

if (!caCertPath) {
  throw new Error(
    "CA_CERTIFICATE_PATH is not defined in the environment variables"
  );
}

const caCert = fs.readFileSync(caCertPath);

export const db = createConnection({
  host: process.env.AIVAN_HOST,
  user: process.env.AIVAN_USERNAME,
  password: process.env.AIVAN_PASSWORD,
  database: process.env.AIVAN_DB,
  connectTimeout: 30000,
  port: parseInt(process.env.SQLPORT || "20285"),
  ssl: {
    ca: caCert,
    rejectUnauthorized: true,
  },
});

async function main() {
  db.connect((err) => {
    if (err) {
      console.error("Error connecting to the MySQL database:", err);
    } else {
      console.log("Successfully connected to the MySQL database");
    }
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Connect to MongoDB
  const connect = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI as string);
      console.log("Connected to MongoDB.");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  };

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected!");
  });

  // Middlewares
  const corsOptions = {
    origin: [
      "http://localhost:5173",
      "https://bookingcom-frontend-production.up.railway.app",
      "http://bookingcom-frontend-production.up.railway.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(express.json());
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // Enable pre-flight requests for all routes

  // Routes
  app.use("/api/auth", authRoute);
  app.use("/api/users", usersRoute);
  app.use("/api/hotels", hotelRoutes);
  app.use("/api/reservations", verifyToken, reservationRoutes);
  app.use("/api/reviews", verifyToken, reviewRoutes);
  app.use("/api/paypal", paymentRoutes);

  // Centralized Error Handling Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Something went wrong";
    res.status(status).json({
      success: false,
      status,
      message,
    });
  });

  connect();
}

main();
