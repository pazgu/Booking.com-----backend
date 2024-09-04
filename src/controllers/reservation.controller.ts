import { log } from "console";
import { db } from "..";
import { Request, Response } from "express";
import mongoose from "mongoose"; // Assuming you're using Mongoose for MongoDB
import { RowDataPacket, ResultSetHeader } from "mysql2"; // Import types from mysql2

export const addNewReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    userID,
    email,
    hotelID,
    roomID,
    startDate,
    endDate,
    roomsForReservation,
  } = req.body;

  try {
    // Ensure the MongoDB connection is ready
    if (!mongoose.connection.readyState) {
      throw new Error("MongoDB is not connected");
    }

    const dbConnection = mongoose.connection.db;
    if (!dbConnection) {
      throw new Error("MongoDB connection is undefined");
    }

    // Convert the userID to ObjectId before querying MongoDB
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(userID);
    } catch (error) {
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

    db.query<RowDataPacket[]>(getAvailableRoomsSql, values, (err, results) => {
      if (err) {
        res.status(500).json({ error: "SQL database error", details: err });
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

      db.query<ResultSetHeader>(
        insertSql,
        insertValues,
        (insertErr, result) => {
          if (insertErr) {
            res
              .status(500)
              .json({ error: "SQL database error", details: insertErr });
            return;
          }

          res.status(201).json({
            message: "Reservation added successfully",
            reservationID: result.insertId, // Accessing insertId from ResultSetHeader
            email: user.email, // Return the email in the response
          });
        }
      );
    });
  } catch (mongoErr) {
    res.status(500).json({ error: "MongoDB error", details: mongoErr });
  }
};

export const getReservationPerUserid = (req: Request, res: Response) => {
  const userId = req.params.userId;
  const sql = `
    SELECT * FROM Reservations WHERE userID = ?
  `;
  db.query(sql, [userId], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Database error", details: err });
      return;
    }
    res.status(200).json(result);
  });
};

export const deleteReservation = (req: Request, res: Response): void => {
  const reservationID = req.params.reservationID;

  const deleteSql = `DELETE FROM Reservations WHERE id = ?`;

  db.query(deleteSql, [reservationID], (err: any, result: any) => {
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
