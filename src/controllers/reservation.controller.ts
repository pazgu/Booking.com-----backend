import { db } from "..";
import { ResultSetHeader } from 'mysql2';
import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";


interface QuantityResult extends RowDataPacket {
  new_quantity: number;
}
export const addNewReservation = (req: Request, res: Response): void => {
  const { userID, hotelID, roomID, startDate, endDate } = req.body;
  
  const getQuantitySql = `
    SELECT 
      CASE 
        WHEN EXISTS (
          SELECT 1
          FROM Reservations
          WHERE HotelID = ?
            AND RoomID = ?
            AND (
              (startDate <= ? AND endDate >= ?) OR
              (startDate <= ? AND endDate >= ?)
            )
        ) THEN (
          SELECT quantity - 1
          FROM Reservations
          WHERE HotelID = ?
            AND RoomID = ?
            AND (
              (startDate <= ? AND endDate >= ?) OR
              (startDate <= ? AND endDate >= ?)
            )
          ORDER BY quantity ASC
          LIMIT 1
        )
        ELSE (
          SELECT initial_quantity - 1
          FROM RoomsPerHotel
          WHERE HotelID = ?
            AND RoomID = ?
        )
      END AS new_quantity
  `;

  const quantityValues = [
    hotelID, roomID, startDate, endDate, startDate, endDate,
    hotelID, roomID, startDate, endDate, startDate, endDate,
    hotelID, roomID
  ];

  db.query<QuantityResult[]>(getQuantitySql, quantityValues, (quantityErr, quantityResult) => {
    if (quantityErr) {
      res.status(500).json({ error: 'Database error', details: quantityErr });
      return;
    }

    if (quantityResult.length === 0) {
      res.status(404).json({ error: 'No available rooms found' });
      return;
    }

    const newQuantity = quantityResult[0].new_quantity;

    const insertSql = `
      INSERT INTO Reservations (userID, HotelID, RoomID, startDate, endDate, quantity)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    const insertValues = [userID, hotelID, roomID, startDate, endDate, newQuantity];

    db.query<ResultSetHeader>(insertSql, insertValues, (insertErr, result) => {
      if (insertErr) {
        res.status(500).json({ error: 'Database error', details: insertErr });
        return;
      }
      res.status(201).json({ message: 'Reservation added successfully', reservationID: result.insertId });
    });
  });
};

export const getReservationPerUserid = (req: Request, res: Response)=>{
  const userID = req.params.userID;
  const sql = `
    SELECT * FROM Reservations WHERE userID =?
  `;
  db.query(sql, [userID], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Database error', details: err });
      return;
    }
    res.status(200).json(result);
  });
  
}