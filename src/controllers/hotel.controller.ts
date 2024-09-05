import { Request, Response } from "express";
import { db } from "..";
import { QueryError, RowDataPacket, FieldPacket } from "mysql2";

// Utility function to calculate the number of nights between two dates
const calculateNumberOfNights = (startDate: Date, endDate: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  const diffDays = Math.round(
    Math.abs((endDate.getTime() - startDate.getTime()) / oneDay)
  );
  return diffDays;
};

// Utility function to validate and parse date
const parseDate = (dateString: string): Date | null => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// Get hotels with filtering and pagination, returning only standard rooms
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
    distanceMax,
    meals,
    starsRating,
    facilities,
    scoreLetter,
    sortBy,
    sortOrder = "ASC",
    offset = 0,
  } = req.query;

  try {
    let query = `
      SELECT DISTINCT h.id, h.name, h.city, rph.price, r.type, h.reviews, h.latitude, h.longitude, avg.location,
                      h.freeCancellation, h.prepayment, h.scoreLetter, 
                      h.starsRating, h.meals, h.distance, h.image,
                      ROUND(avg.avgRating, 1) AS avgRating,
                      (
                        rph.price * ? * ? * ?
                      ) AS totalPrice
      FROM Hotels h
      JOIN RoomsPerHotel rph ON h.id = rph.HotelID
      JOIN Rooms r ON rph.RoomID = r.id
      LEFT JOIN AVGRating avg ON h.id = avg.hotelID
      WHERE r.type = 'Standard Room'
    `;

    // Default to 1 if numOfRooms or numOfPeople is not provided
    const numRooms = parseInt(numOfRooms as string) || 1;
    const numPeople = parseInt(numOfPeople as string) || 1;

    // Validate and parse dates
    const parsedStartDate = startDate ? parseDate(startDate as string) : null;
    const parsedEndDate = endDate ? parseDate(endDate as string) : null;

    let numNights = 1;
    if (parsedStartDate && parsedEndDate) {
      numNights = calculateNumberOfNights(parsedStartDate, parsedEndDate);
    } else {
      // Handle invalid date input
      console.warn("Invalid date input. Using default of 1 night.");
    }

    const queryParams: (string | number)[] = [numNights, numRooms, numPeople];

    if (name) {
      query += " AND h.name LIKE ?";
      queryParams.push(`%${name}%`);
    }
    if (city) {
      query += " AND h.city LIKE ?";
      queryParams.push(`%${city}%`);
    }
    if (priceMin) {
      query += " AND rph.price >= ?";
      queryParams.push(parseFloat(priceMin as string));
    }
    if (priceMax) {
      let price = parseFloat(priceMax as string);
      if (price = 250) {
        query += " AND rph.price <= 9999999999"
      }
      else {
        query += " And rph.price <= ?";
      }
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
    if (distanceMax) {
      query += " AND h.distance <= ?";
      queryParams.push(parseInt(distanceMax as string));
    }
    if (meals) {
      const mealsList = (meals as string).split(",");
      query += ` AND h.meals IN (${mealsList.map(() => "?").join(",")})`;
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

    // Sorting
    if (sortBy) {
      switch (sortBy) {
        case "price":
          query += ` ORDER BY totalPrice ${sortOrder}`; // low to high
          break;
        case "distance":
          query += ` ORDER BY h.distance ${sortOrder}`; // close to far
        case "rating":
          query += ` ORDER BY h.scoreLetter ${sortOrder}`; // high to low
          break;
        default:
          query += ` ORDER BY h.id ASC`; // default
          break;
      }
    } else {
      query += " ORDER BY h.id ASC"; // default
    }

    // Total count
    const countQuery = `SELECT COUNT(*) as totalCount FROM (${query}) as subquery`;
    const [countRows] = await db
      .promise()
      .query<RowDataPacket[]>(countQuery, queryParams);
    const totalCount = countRows[0].totalCount;


    const [rows] = await db
      .promise()
      .query<RowDataPacket[]>(query, queryParams);
    res.json({ totalCount, data: rows });
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Server error" });
  }
};

interface Review {
  text: string;
  userId: string;
}

export const getHotelDetailsWithAvailableRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;
  const { startDate, endDate } = req.query;

  if (!id || !startDate || !endDate) {
    res.status(400).json({ message: "Missing required parameters" });
    return;
  }

  const parsedStartDate = parseDate(startDate as string);
  const parsedEndDate = parseDate(endDate as string);

  if (!parsedStartDate || !parsedEndDate) {
    res.status(400).json({ message: "Invalid date format" });
    return;
  }

  try {
    // Query for hotel details
    const hotelQuery = `
    SELECT 
    Hotels.*,
    AVGRating.*,
    ImageSubquery.imageURLs,
    FacilitiesSubquery.facilities,
    ReviewSubquery.reviews
    FROM 
        Hotels
    LEFT JOIN 
        AVGRating ON Hotels.id = AVGRating.hotelID
    LEFT JOIN (
        SELECT 
            HotelID,
            JSON_ARRAYAGG(ImageURL) AS imageURLs
        FROM 
            Images
        GROUP BY 
            HotelID
    ) AS ImageSubquery ON Hotels.id = ImageSubquery.HotelID
    LEFT JOIN (
        SELECT 
            hotelID,
            GROUP_CONCAT(DISTINCT CONCAT(FacilitiesTable.id, ':', FacilitiesTable.category, ':', FacilitiesTable.name)) AS facilities
        FROM 
            HotelFacilities
        JOIN 
            FacilitiesTable ON HotelFacilities.facilityID = FacilitiesTable.id
        GROUP BY 
            hotelID
    ) AS FacilitiesSubquery ON Hotels.id = FacilitiesSubquery.hotelID
    LEFT JOIN (
        SELECT 
            hotelID,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'text', text,
                    'userId', userID
                )
            ) AS reviews
        FROM 
            UserReview
        GROUP BY 
            hotelID
    ) AS ReviewSubquery ON Hotels.id = ReviewSubquery.hotelID
    WHERE 
        Hotels.id = ?
    `;

    // Query for available rooms
    const roomsQuery = `
      SELECT r.id, r.type, r.description, r.capacity, rph.price,
             rph.initial_quantity - COALESCE(SUM(res.quantity), 0) as available_rooms
      FROM Rooms r
      JOIN RoomsPerHotel rph ON r.id = rph.RoomID
      LEFT JOIN Reservations res ON rph.HotelID = res.HotelID AND rph.RoomID = res.RoomID
        AND (
          (res.startDate <= ? AND res.endDate > ?) OR
          (res.startDate < ? AND res.endDate >= ?) OR
          (res.startDate >= ? AND res.endDate <= ?)
        )
      WHERE rph.HotelID = ?
      GROUP BY r.id, r.type, r.description, r.capacity, rph.price, rph.initial_quantity
      HAVING available_rooms > 0
      ORDER BY rph.price ASC
    `;

    // Execute both queries concurrently
    const [hotelResult, roomsResult] = await Promise.all([
      db.promise().query<RowDataPacket[]>(hotelQuery, [id]),
      db
        .promise()
        .query<RowDataPacket[]>(roomsQuery, [
          parsedEndDate,
          parsedStartDate,
          parsedEndDate,
          parsedEndDate,
          parsedStartDate,
          parsedEndDate,
          id,
        ]),
    ]);

    if (hotelResult[0].length === 0) {
      res.status(404).json({ error: "Hotel not found" });
      return;
    }

    const hotel = hotelResult[0][0];
    const availableRooms = roomsResult[0];

    // Parse the facilities string into an array of objects
    if (typeof hotel.facilities === "string" && hotel.facilities.length > 0) {
      hotel.facilities = hotel.facilities.split(",").map((facility: string) => {
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

    // Combine hotel details with available rooms
    const result = {
      ...hotel,
      availableRooms,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching hotel details with available rooms:", error);
    res.status(500).json({ message: "Server error" });
  }
};
