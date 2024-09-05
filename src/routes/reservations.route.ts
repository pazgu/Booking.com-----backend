import express from "express";
import {
  addNewReservation,
  getReservationPerUserid,
  deleteReservation,
  checkReservation,
} from "../controllers/reservation.controller";

const reservationRoutes = express.Router();

reservationRoutes.get("/:userId", getReservationPerUserid);
reservationRoutes.post("/reservation", addNewReservation);
reservationRoutes.delete("/cancel/:reservationID", deleteReservation);
reservationRoutes.post("/checkReservation", checkReservation);

export default reservationRoutes;
