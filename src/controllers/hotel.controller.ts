import { Request, Response } from "express";
import { db } from "..";
import { QueryError, RowDataPacket, FieldPacket } from 'mysql2';
interface Review{
  text: string;
  userId: string;
}
export const getHotelByID = (req: Request, res: Response): void => {
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

  db.query(
    sql, 
    [id],
    (err: QueryError | null, result: RowDataPacket[], fields: FieldPacket[]) => {
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
      if (typeof hotel.facilities === 'string' && hotel.facilities.length > 0) {
        hotel.facilities = hotel.facilities.split(',').map((facility: string) => {
          const [id, category, name] = facility.split(':');
          return { id, category, name };
        });
      } else {
        hotel.facilities = [];
      }

      // Parse the reviews JSON string into an array of objects
      if (typeof hotel.reviews === 'string') {
        try {
          hotel.reviews = JSON.parse(hotel.reviews);
        } catch (e) {
          console.error("Error parsing reviews JSON:", e);
          hotel.reviews = [];
        }
      } else if (!Array.isArray(hotel.reviews)) {
        hotel.reviews = [];
      }

      // Ensure hotel.reviews is typed correctly as an array of Review objects
      hotel.reviews = hotel.reviews.filter((review: Review | null) => review !== null);

      // Log the hotel object for debugging
      console.log("Hotel object:", JSON.stringify(hotel, null, 2));

      res.status(200).json(hotel);
    }
  );
};
