import express from "express";
import { addReview } from "../controllers/review.controller";

const reviewRoutes = express.Router();
reviewRoutes.post("/", addReview);

export default reviewRoutes;
