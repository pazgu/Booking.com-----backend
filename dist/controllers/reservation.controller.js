"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReservation = exports.getReservationPerUserid = exports.addNewReservation = void 0;
const __1 = require("..");
const addNewReservation = (req, res) => {
    const { userID, hotelID, roomID, startDate, endDate, roomsForReservation } = req.body;
    // First query: Check how many rooms are available considering the date range
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
        endDate, // Checking if the reservation ends during an existing reservation
        startDate, // Checking if the reservation starts during an existing reservation
        endDate, // Checking if the reservation ends during an existing reservation
        startDate, // Checking if the reservation starts during an existing reservation
        startDate, // Checking if the existing reservation starts within the requested range
        endDate, // Checking if the existing reservation ends within the requested range
    ];
    __1.db.query(getAvailableRoomsSql, values, (err, results) => {
        if (err) {
            res.status(500).json({ error: "Database error", details: err });
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
        // Proceed to insert the reservation if there are enough rooms available
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
                res.status(500).json({ error: "Database error", details: insertErr });
                return;
            }
            res.status(201).json({
                message: "Reservation added successfully",
                reservationID: result.insertId,
            });
        });
    });
};
exports.addNewReservation = addNewReservation;
const getReservationPerUserid = (req, res) => {
    const userId = req.params.userId;
    const sql = `
    SELECT * FROM Reservations WHERE userID = ?
  `;
    __1.db.query(sql, [userId], (err, result) => {
        if (err) {
            res.status(500).json({ error: "Database error", details: err });
            return;
        }
        res.status(200).json(result);
    });
};
exports.getReservationPerUserid = getReservationPerUserid;
const deleteReservation = (req, res) => {
    const reservationID = req.params.reservationID;
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
};
exports.deleteReservation = deleteReservation;
