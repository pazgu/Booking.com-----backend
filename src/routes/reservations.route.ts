import express from "express";
import {
  addNewReservation,
  getReservationPerUserid,
  deleteReservation,
} from "../controllers/reservation.controller";

const reservationRoutes = express.Router();

reservationRoutes.get("/:userId", getReservationPerUserid);
reservationRoutes.post("/reservation", addNewReservation);
reservationRoutes.delete("/cancel/:reservationID", deleteReservation);

export default reservationRoutes;
