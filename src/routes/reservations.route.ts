import express from "express";

import { verifyToken } from "../middleware/auth.middleware";
import { addNewReservation, getReservationPerUserid } from "../controllers/reservation.controller";

const reservationRoutes = express.Router();

reservationRoutes.post("/reservation", addNewReservation)
reservationRoutes.get("/reservation/:userId",getReservationPerUserid)

export default reservationRoutes;