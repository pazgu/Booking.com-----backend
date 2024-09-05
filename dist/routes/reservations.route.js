"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reservation_controller_1 = require("../controllers/reservation.controller");
const reservationRoutes = express_1.default.Router();
reservationRoutes.get("/:userId", reservation_controller_1.getReservationPerUserid);
reservationRoutes.post("/reservation", reservation_controller_1.addNewReservation);
reservationRoutes.delete("/cancel/:reservationID", reservation_controller_1.deleteReservation);
exports.default = reservationRoutes;
