"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHotelByID = exports.getHotels = void 0;
const __1 = require("..");
// Get hotels with filtering and pagination
const getHotels = async (req, res) => {
    console.log("getHotels function called");
    const { city, priceMin, priceMax, facilities, roomType, sortBy, sortOrder = "ASC", limit = 30, offset = 0, } = req.query;
    try {
        let query = "SELECT * FROM Hotels WHERE 1=1";
        const queryParams = [];
        if (city) {
            query += " AND city = ?";
            queryParams.push(city);
        }
        if (priceMin) {
            query += " AND price >= ?";
            queryParams.push(parseFloat(priceMin));
        }
        if (priceMax) {
            query += " AND price <= ?";
            queryParams.push(parseFloat(priceMax));
        }
        if (facilities) {
            const facilitiesList = facilities.split(",");
            query += ` AND EXISTS (SELECT 1 FROM HotelFacilities hf 
                                  WHERE hf.hotelID = Hotels.id 
                                  AND hf.facilityID IN (${facilitiesList
                .map(() => "?")
                .join(",")}))`;
            queryParams.push(...facilitiesList);
        }
        if (roomType) {
            query += ` AND EXISTS (SELECT 1 FROM RoomsPerHotel rph 
                                  WHERE rph.hotelID = Hotels.id 
                                  AND rph.type = ?)`;
            queryParams.push(roomType);
        }
        // Add sorting
        if (sortBy) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        }
        else {
            query += " ORDER BY id ASC"; // Default sorting
        }
        // Add pagination
        query += " LIMIT ? OFFSET ?";
        queryParams.push(parseInt(limit), parseInt(offset));
        const [rows] = await __1.db
            .promise()
            .query(query, queryParams);
        res.json(rows);
    }
    catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getHotels = getHotels;
const getHotelByID = (req, res) => {
    const id = req.params.id;
    const sql = `
    SELECT 
      Hotels.*, 
      AVGRating.*,
      GROUP_CONCAT(DISTINCT CONCAT(FacilitiesTable.id, ':', FacilitiesTable.category, ':', FacilitiesTable.name)) AS facilities,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'text', UserReview.text,
          'userId', UserReview.userID
        )
      ) AS reviews
    FROM Hotels 
    LEFT JOIN AVGRating ON Hotels.id = AVGRating.hotelID
    LEFT JOIN HotelFacilities ON Hotels.id = HotelFacilities.hotelID
    LEFT JOIN FacilitiesTable ON HotelFacilities.facilityID = FacilitiesTable.id
    LEFT JOIN UserReview ON Hotels.id = UserReview.hotelID
    WHERE Hotels.id = ?
    GROUP BY Hotels.id`;
    __1.db.query(sql, [id], (err, result, fields) => {
        if (err) {
            console.error("Error fetching hotel by id:", err);
            res.status(500).json({ error: "Server error", details: err.message });
            return;
        }
        if (result.length === 0) {
            res.status(404).json({ error: "Hotel not found" });
            return;
        }
        const hotel = result[0];
        // Parse the facilities string into an array of objects
        if (typeof hotel.facilities === "string" && hotel.facilities.length > 0) {
            hotel.facilities = hotel.facilities
                .split(",")
                .map((facility) => {
                const [id, category, name] = facility.split(":");
                return { id, category, name };
            });
        }
        else {
            hotel.facilities = [];
        }
        // Parse the reviews JSON string into an array of objects
        if (typeof hotel.reviews === "string") {
            try {
                hotel.reviews = JSON.parse(hotel.reviews);
            }
            catch (e) {
                console.error("Error parsing reviews JSON:", e);
                hotel.reviews = [];
            }
        }
        else if (!Array.isArray(hotel.reviews)) {
            hotel.reviews = [];
        }
        // Ensure hotel.reviews is typed correctly as an array of Review objects
        hotel.reviews = hotel.reviews.filter((review) => review !== null);
        // Log the hotel object for debugging
        console.log("Hotel object:", JSON.stringify(hotel, null, 2));
        res.status(200).json(hotel);
    });
};
exports.getHotelByID = getHotelByID;
