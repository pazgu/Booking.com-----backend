import { Request, Response } from "express";
import { db } from "..";
import { QueryError, RowDataPacket, FieldPacket } from "mysql2";

// Get hotels with filtering and pagination
export const getHotels = async (req: Request, res: Response) => {
  const {
    numOfPeople,
    numOfRooms,
    startDate,
    endDate,
    name,
    city,
    priceMin,
    priceMax,
    freeCancellation,
    prepayment,
    meals,
    starsRating,
    facilities,
    scoreLetter,
    sortBy,
    sortOrder = "ASC",
    limit = 30,
    offset = 0,
  } = req.query;

  try {
    let query = `
      SELECT DISTINCT h.id, h.name, h.city, h.price, 
                      h.freeCancellation, h.prepayment, h.scoreLetter, 
                      h.starsRating, h.scoreLetter, h.meals
      FROM Hotels h
      JOIN RoomsPerHotel rph ON h.id = rph.HotelID
      JOIN Rooms r ON rph.RoomID = r.id
      LEFT JOIN Reservations res ON rph.RoomID = res.RoomID 
                                  AND h.id = res.HotelID 
                                  AND (res.startDate < ? AND res.endDate > ?)
      WHERE 1=1
    `;
    const queryParams: (string | number)[] = [
      startDate as string,
      endDate as string,
    ];

    if (name) {
      query += " AND h.name LIKE ?";
      queryParams.push(`%${name}%`);
    }
    if (city) {
      query += " AND h.city LIKE ?";
      queryParams.push(`%${city}%`);
    }
    if (priceMin) {
      query += " AND h.price >= ?";
      queryParams.push(parseFloat(priceMin as string));
    }
    if (priceMax) {
      query += " AND h.price <= ?";
      queryParams.push(parseFloat(priceMax as string));
    }
    if (freeCancellation === "true") {
      query += " AND h.freeCancellation = ?";
      queryParams.push(1);
    }
    if (prepayment === "true") {
      query += " AND h.prepayment = ?";
      queryParams.push(1);
    }
    if (meals) {
      const mealsList = (meals as string).split(",");
      query += ` AND meals IN (${mealsList.map(() => "?").join(",")})`;
      queryParams.push(...mealsList);
    }
    if (starsRating) {
      const starsRatingList = (starsRating as string).split(",");
      query += ` AND h.starsRating IN (${starsRatingList
        .map(() => "?")
        .join(",")})`;
      queryParams.push(...starsRatingList);
    }
    if (facilities) {
      const facilitiesList = (facilities as string).split(",");
      query += ` AND EXISTS (
                    SELECT 1 
                    FROM HotelFacilities hf
                    JOIN FacilitiesTable ft ON hf.facilityID = ft.id
                    WHERE hf.hotelID = h.id 
                    AND ft.category IN (${facilitiesList
                      .map(() => "?")
                      .join(",")})
                )`;
      queryParams.push(...facilitiesList);
    }
    if (scoreLetter) {
      const scoreLetterList = (scoreLetter as string).split(",");
      query += ` AND h.scoreLetter IN (${scoreLetterList
        .map(() => "?")
        .join(",")})`;
      queryParams.push(...scoreLetterList);
    }

    // Filtering by room availability
    if (numOfPeople || numOfRooms || startDate || endDate) {
      query += `
    AND EXISTS (
      SELECT 1
      FROM RoomsPerHotel rph
      JOIN Rooms r ON rph.RoomID = r.id
      WHERE rph.HotelID = h.id
  `;

      if (numOfPeople) {
        query += " AND r.capacity >= ?";
        queryParams.push(parseInt(numOfPeople as string));
      }

      if (startDate && endDate) {
        query += `
      AND (
        rph.initial_quantity - COALESCE(
          (SELECT SUM(res.quantity)
           FROM Reservations res
           WHERE res.HotelID = h.id
             AND res.RoomID = rph.RoomID
             AND (
               (res.startDate <= ? AND res.endDate > ?)
               OR (res.startDate < ? AND res.endDate >= ?)
               OR (res.startDate >= ? AND res.endDate <= ?)
             )
          ), 0
        ) >= ?
      )
    `;
        queryParams.push(
          endDate as string,
          startDate as string,
          endDate as string,
          startDate as string,
          startDate as string,
          endDate as string,
          numOfRooms ? parseInt(numOfRooms as string) : 1
        );
      }

      query += ")";
    }
    // Sorting
    if (sortBy) {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    } else {
      query += " ORDER BY h.id ASC"; // default
    }

    // Pagination
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await db
      .promise()
      .query<RowDataPacket[]>(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Server error" });
  }
};

interface Review {
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
    (
      err: QueryError | null,
      result: RowDataPacket[],
      fields: FieldPacket[]
    ) => {
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
          .map((facility: string) => {
            const [id, category, name] = facility.split(":");
            return { id, category, name };
          });
      } else {
        hotel.facilities = [];
      }

      // Parse the reviews JSON string into an array of objects
      if (typeof hotel.reviews === "string") {
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
      hotel.reviews = hotel.reviews.filter(
        (review: Review | null) => review !== null
      );

      // Log the hotel object for debugging
      console.log("Hotel object:", JSON.stringify(hotel, null, 2));

      res.status(200).json(hotel);
    }
  );
};
