"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hotel_controller_1 = require("../controllers/hotel.controller");
const hotelRoutes = express_1.default.Router();
hotelRoutes.get("/test", (req, res) => {
    console.log("Test route hit");
    res.json({ message: "Test route working" });
});
hotelRoutes.get("/", hotel_controller_1.getHotels);
// hotelRoutes.get("/:id", getHotelByID);
// router.put("/availability", updateRoomAvailability); // Updating room availability
exports.default = hotelRoutes;
