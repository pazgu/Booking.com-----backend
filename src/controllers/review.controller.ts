import { db } from "..";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Request, Response } from "express";

export const addReview = (req: Request, res: Response) => {
  const {
    hotelID,
    staff,
    facilities,
    cleanliness,
    freeWifi,
    location,
    valueForMoney,
    comfort,
    text,
    userID,
    date,
    username,
  } = req.body;

  // Insert the new review
  const insertQuery = `
        INSERT INTO UserReview (hotelID, staff, facilities, cleanliness, freeWifi, location, valueForMoney, comfort, text, userID, date, username)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?)
    `;

  db.query(
    insertQuery,
    [
      hotelID,
      staff,
      facilities,
      cleanliness,
      freeWifi,
      location,
      valueForMoney,
      comfort,
      text,
      userID,
      date,
      username,
    ],
    (err, result: ResultSetHeader) => {
      if (err) {
        console.error("Error inserting review:", err);
        return res
          .status(500)
          .json({ error: "Error inserting review", details: err.message });
      }

      console.log(
        "Review inserted successfully. Proceeding to update average ratings."
      );

      // Calculate new averages and update AVGRATING table
      const updateQuery = `
                INSERT INTO AVGRating (hotelID, staff, facilities, cleanliness, freeWifi, location, valueForMoney, comfort, avgRating)
                SELECT 
                    ?,
                    AVG(staff) as staff,
                    AVG(facilities) as facilities,
                    AVG(cleanliness) as cleanliness,
                    AVG(freeWifi) as freeWifi,
                    AVG(location) as location,
                    AVG(valueForMoney) as valueForMoney,
                    AVG(comfort) as comfort,
                    (AVG(staff) + AVG(facilities) + AVG(cleanliness) + AVG(freeWifi) + AVG(location) + AVG(valueForMoney) + AVG(comfort)) / 7 as avgRating
                FROM UserReview
                WHERE hotelID = ?
                ON DUPLICATE KEY UPDATE
                    staff = VALUES(staff),
                    facilities = VALUES(facilities),
                    cleanliness = VALUES(cleanliness),
                    freeWifi = VALUES(freeWifi),
                    location = VALUES(location),
                    valueForMoney = VALUES(valueForMoney),
                    comfort = VALUES(comfort),
                    avgRating = VALUES(avgRating)
            `;

      db.query(
        updateQuery,
        [hotelID, hotelID],
        (updateErr, updateResult: RowDataPacket[]) => {
          if (updateErr) {
            console.error("Error updating average ratings:", updateErr);
            return res.status(500).json({
              error: "Error updating average ratings",
              details: updateErr.message,
            });
          }

          console.log("Average ratings updated successfully:", updateResult);
          res.status(200).json({
            message: "Review added and average ratings updated successfully",
          });
        }
      );
    }
  );
};
