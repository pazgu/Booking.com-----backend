import express from "express";
import {

 getHotelByID,
 
} from "../controllers/hotel.controller";

const hotelRoutes = express.Router();

hotelRoutes.get("/:id", getHotelByID);
// router.get("/", getHotels);
// router.put("/availability", updateRoomAvailability); // Updating room availability

export default hotelRoutes;
