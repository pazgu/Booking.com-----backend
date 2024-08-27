"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review.controller");
const reviewRoutes = express_1.default.Router();
reviewRoutes.post("/", review_controller_1.addReview);
exports.default = reviewRoutes;
