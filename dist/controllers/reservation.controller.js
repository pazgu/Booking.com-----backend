"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkReservation = exports.checkReservationStatus = exports.deleteReservation = exports.getReservationPerUserid = exports.addNewReservation = void 0;
const __1 = require("..");
const mongoose_1 = __importDefault(require("mongoose")); // Assuming you're using Mongoose for MongoDB
const date_fns_1 = require("date-fns");
const email_service_1 = require("../services/email.service");
const date_fns_2 = require("date-fns"); // Import format from date-fns
const addNewReservation = async (req, res) => {
    const { userID, email, hotelID, roomID, startDate, endDate, roomsForReservation, hotelName, } = req.body;
    try {
        // Ensure the MongoDB connection is ready
        if (!mongoose_1.default.connection.readyState) {
            throw new Error("MongoDB is not connected");
        }
        const dbConnection = mongoose_1.default.connection.db;
        if (!dbConnection) {
            throw new Error("MongoDB connection is undefined");
        }
        // Convert the userID to ObjectId before querying MongoDB
        let objectId;
        try {
            objectId = new mongoose_1.default.Types.ObjectId(userID);
        }
        catch (error) {
            console.error("Invalid ObjectId format:", error);
            res.status(400).json({ error: "Invalid userID format" });
            return;
        }
        // Query MongoDB for the user by ObjectId only
        const usersCollection = dbConnection.collection("users");
        const user = await usersCollection.findOne({ _id: objectId });
        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }
        if (user.email !== email) {
            res.status(400).json({ error: "User ID and email do not match" });
            return;
        }
        // 1. Query SQL for the hotel name by hotelID
        const getHotelNameSql = `SELECT name FROM Hotels WHERE id = ?`;
        __1.db.query(getHotelNameSql, [hotelID], (err, hotelResults) => {
            if (err || hotelResults.length === 0) {
                res.status(500).json({
                    error: "Hotel not found or SQL database error",
                    details: err,
                });
                return;
            }
            const hotelName = hotelResults[0].name;
            // 2. Query SQL for available rooms
            const getAvailableRoomsSql = `
        SELECT 
          SUM(quantity) AS reservedRooms
        FROM Reservations
        WHERE HotelID = ?
          AND RoomID = ?
          AND (
            (startDate <= ? AND endDate >= ?) OR
            (startDate <= ? AND endDate >= ?) OR
            (startDate >= ? AND endDate <= ?)
          )
      `;
            const values = [
                hotelID,
                roomID,
                endDate,
                startDate,
                endDate,
                startDate,
                startDate,
                endDate,
            ];
            __1.db.query(getAvailableRoomsSql, values, (err, results) => {
                if (err) {
                    res
                        .status(500)
                        .json({ error: "SQL database error", details: err });
                    return;
                }
                const reservedRooms = results[0]?.reservedRooms || 0;
                const totalAvailableRooms = 10; // Assuming 10 rooms are initially available per room type
                let availableRooms = totalAvailableRooms - reservedRooms;
                if (availableRooms < 0) {
                    availableRooms = 0; // Prevent negative available rooms.
                }
                if (availableRooms < roomsForReservation) {
                    res.status(400).json({
                        error: `Sorry, we are unable to complete your reservation as only ${availableRooms} room(s) are available for your selected dates. Please try adjusting your dates or reduce the number of rooms.`,
                    });
                    return;
                }
                // 3. Proceed to insert the reservation into SQL if there are enough rooms available
                const insertSql = `
          INSERT INTO Reservations (userID, HotelID, RoomID, startDate, endDate, quantity)
          VALUES (?, ?, ?, ?, ?, ?);
        `;
                const insertValues = [
                    userID,
                    hotelID,
                    roomID,
                    startDate,
                    endDate,
                    roomsForReservation,
                ];
                __1.db.query(insertSql, insertValues, (insertErr, result) => {
                    if (insertErr) {
                        res
                            .status(500)
                            .json({ error: "SQL database error", details: insertErr });
                        return;
                    }
                    const reservationID = result.insertId;
                    (0, email_service_1.sendReservationEmail)({
                        hotelID,
                        roomID,
                        email,
                        startDate,
                        endDate,
                        roomsForReservation,
                        hotelName,
                        reservationID,
                    });
                    // Send final response with hotel name, reservation ID, and email
                    res.status(201).json({
                        message: "Reservation added successfully",
                        reservationID: result.insertId, // Accessing insertId from ResultSetHeader
                        email: user.email, // Return the email in the response
                        hotelName, // Return the hotel name
                    });
                });
            });
        });
    }
    catch (mongoErr) {
        res.status(500).json({ error: "MongoDB error", details: mongoErr });
    }
};
exports.addNewReservation = addNewReservation;
const getReservationPerUserid = (req, res) => {
    const userId = req.params.userId;
    // SQL query to join Reservations, Hotels, and RoomsPerHotel tables
    const sql = `
    SELECT 
      Reservations.id, 
      Reservations.startDate, 
      Reservations.endDate, 
      Reservations.quantity,
      Hotels.id AS hotelId,   -- Add hotelId
      Hotels.name AS hotelName, 
      Hotels.city AS city,
      Hotels.image AS image,
      RoomsPerHotel.price AS roomPrice
    FROM 
      Reservations
    JOIN 
      Hotels ON Reservations.HotelID = Hotels.id
    JOIN 
      RoomsPerHotel ON Reservations.RoomID = RoomsPerHotel.RoomID 
    WHERE 
      Reservations.userID = ? 
      AND RoomsPerHotel.HotelID = Reservations.HotelID
    ORDER BY Reservations.startDate DESC;  -- Order by startDate descending
  `;
    // Query the database
    __1.db.query(sql, [userId], (err, result) => {
        if (err) {
            res.status(500).json({ error: "Database error", details: err });
            return;
        }
        // Now you can safely map through the result
        const calculatedResult = result.map((row) => {
            const startDate = new Date(row.startDate);
            const endDate = new Date(row.endDate);
            const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Calculate number of nights
            // Total price = room price * number of nights * quantity
            const totalPrice = row.roomPrice * nights * row.quantity;
            // Format the start and end dates
            const formattedStartDate = (0, date_fns_2.format)(startDate, "d MMM yyyy");
            const formattedEndDate = (0, date_fns_2.format)(endDate, "d MMM yyyy");
            return {
                ...row, // Spread the original row data
                totalPrice,
                nights,
                dateRange: `${formattedStartDate} – ${formattedEndDate}`, // Format the date range
            };
        });
        res.status(200).json(calculatedResult);
    });
};
exports.getReservationPerUserid = getReservationPerUserid;
const deleteReservation = (req, res) => {
    const reservationID = req.params.reservationID;
    const userID = req.userId; // Extract the userID from the request (set by the middleware)
    // First, fetch the userID associated with the reservation to ensure ownership
    const getReservationSql = `SELECT userID FROM Reservations WHERE id = ?`;
    __1.db.query(getReservationSql, [reservationID], (err, result) => {
        if (err) {
            res.status(500).json({ error: "Database error", details: err });
            return;
        }
        if (result.length === 0) {
            res.status(404).json({ error: "Reservation not found" });
            return;
        }
        const reservationOwnerID = result[0].userID;
        // Check if the current user owns the reservation
        if (reservationOwnerID !== userID) {
            res.status(403).json({
                error: "You do not have permission to cancel this reservation",
            });
            return;
        }
        // If the user owns the reservation, proceed to delete it
        const deleteSql = `DELETE FROM Reservations WHERE id = ?`;
        __1.db.query(deleteSql, [reservationID], (err, result) => {
            if (err) {
                res.status(500).json({ error: "Database error", details: err });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: "Reservation not found" });
                return;
            }
            res.status(200).json({ message: "Reservation deleted successfully" });
        });
    });
};
exports.deleteReservation = deleteReservation;
const checkReservationStatus = async (userID, reservationID) => {
    try {
        // Ensure MongoDB connection is ready
        if (!mongoose_1.default.connection.readyState) {
            throw new Error("MongoDB is not connected");
        }
        const dbConnection = mongoose_1.default.connection.db;
        if (!dbConnection) {
            throw new Error("MongoDB connection is undefined");
        }
        // Convert the userID to ObjectId before querying MongoDB
        let objectId;
        try {
            objectId = new mongoose_1.default.Types.ObjectId(userID);
        }
        catch (error) {
            console.error("Invalid ObjectId format:", error);
            return false; // Return false if userID format is invalid
        }
        // 1. Check if the reservation exists and belongs to the user
        const checkReservationSql = `
      SELECT userID, startDate, endDate 
      FROM Reservations 
      WHERE id = ?
    `;
        const reservationResult = await new Promise((resolve, reject) => {
            __1.db.query(checkReservationSql, [reservationID], (err, result) => {
                if (err)
                    return reject(err);
                resolve(result);
            });
        });
        if (reservationResult.length === 0) {
            return false; // Return false if the reservation doesn't exist
        }
        const reservation = reservationResult[0];
        // 2. Check if the reservation belongs to the given userID
        if (reservation.userID !== userID) {
            return false; // Return false if the reservation does not belong to this user
        }
        // 3. Check if the reservation has already happened by its dates
        const currentDate = new Date();
        const endDate = new Date(reservation.endDate); // Parse the end date
        // Return true if the reservation has already happened (endDate is before currentDate)
        return (0, date_fns_1.isBefore)(endDate, currentDate);
    }
    catch (error) {
        console.error("Error checking reservation status:", error);
        return false; // Return false in case of any error
    }
};
exports.checkReservationStatus = checkReservationStatus;
const checkReservation = async (req, res) => {
    const { userID, reservationID } = req.body; // Get userID and reservationID from the request body
    const hasReservationHappened = await (0, exports.checkReservationStatus)(userID, reservationID);
    if (hasReservationHappened) {
        res.status(200).json({ success: true });
    }
    else {
        res.status(400).json({ success: false });
    }
};
exports.checkReservation = checkReservation;
