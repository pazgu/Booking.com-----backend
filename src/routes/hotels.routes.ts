import express from "express";
import { getHotelByID, getHotels } from "../controllers/hotel.controller";

const hotelRoutes = express.Router();
hotelRoutes.get("/test", (req, res) => {
  console.log("Test route hit");
  res.json({ message: "Test route working" });
});

hotelRoutes.get("/", getHotels);
// hotelRoutes.get("/:id", getHotelByID);
// router.put("/availability", updateRoomAvailability); // Updating room availability

export default hotelRoutes;
