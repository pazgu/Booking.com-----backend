import { db } from "./index"; // Ensure correct path to your database connection
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Function to generate a random integer between min and max (inclusive)
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sample review texts
const reviewTexts = [
  "The hotel was fantastic! Great service and very clean.",
  "Had a wonderful stay, the location is perfect, and the staff were friendly.",
  "Comfortable rooms and good amenities. Would recommend.",
  "Loved the facilities, especially the pool. The staff were very helpful.",
  "The room was cozy, and the WiFi was fast. Great value for the money.",
  "The hotel was in a great spot, easy to access attractions. Would stay again.",
  "Clean rooms, good food, and the staff were accommodating.",
  "Amazing view from the room, and the comfort was excellent.",
  "Overall a very pleasant stay, close to public transport and good restaurants.",
  "The hotel exceeded expectations. The location and comfort were top-notch.",
];

// Predefined user IDs for reviews
const userIDs = [
  "66c7308941f8b5c475302e59",
  "66c731f6ab5ca71d6d81eeb0",
  "66cc27b5f895f4c9817fdc9e",
  "66c9c7a0cd5b808af70064fc",
];

// Function to generate random reviews for hotels and update the average ratings
async function seedReviews() {
  try {
    // Get all hotels
    const [hotels] = await db
      .promise()
      .query<RowDataPacket[]>("SELECT id FROM Hotels");

    // Type assertion to ensure hotels is an array of objects
    const hotelList = hotels as { id: number }[];

    // Iterate through hotels and generate reviews
    for (const hotel of hotelList) {
      const numberOfReviews = getRandomInt(5, 15); // Random number of reviews between 5 and 15
      for (let i = 0; i < numberOfReviews; i++) {
        const review = {
          hotelID: hotel.id,
          staff: getRandomInt(5, 10),
          facilities: getRandomInt(5, 10),
          cleanliness: getRandomInt(5, 10),
          freeWifi: getRandomInt(5, 10),
          location: getRandomInt(5, 10),
          valueForMoney: getRandomInt(5, 10),
          comfort: getRandomInt(5, 10),
          text: reviewTexts[getRandomInt(0, reviewTexts.length - 1)],
          userID: userIDs[getRandomInt(0, userIDs.length - 1)],
        };

        const insertQuery = `
          INSERT INTO UserReview (hotelID, staff, facilities, cleanliness, freeWifi, location, valueForMoney, comfort, text, userID)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db
          .promise()
          .query<ResultSetHeader>(insertQuery, Object.values(review));
        console.log(`Generated review ${i + 1} for hotelID: ${hotel.id}`);

        // Now, update the average ratings for the hotel
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

        await db
          .promise()
          .query<RowDataPacket[]>(updateQuery, [hotel.id, hotel.id]);
        console.log(`Updated average ratings for hotelID: ${hotel.id}`);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Error seeding reviews and updating ratings:", err);
  } finally {
    db.end();
  }
}

seedReviews();
