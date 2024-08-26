import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { addReview } from "../controllers/review.controller";

const reviewRoutes = express.Router();
reviewRoutes.post("/",addReview)

export default reviewRoutes;
