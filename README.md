# Booking.com Clone - Backend

This project is a backend implementation for a **Booking.com clone**. It provides APIs to manage hotel reservations, user authentication, reviews, and more. Built with Node.js, TypeScript, and Express, this backend is designed to be robust and scalable.

## Features

- **User Authentication**: Secure login and registration using JWT and password hashing with `bcryptjs`.
- **Hotel Management**: Manage hotels, rooms, and availability.
- **Search and Filters**: Comprehensive search functionality with filters for price, rating, location, and more.
- **Reservations**: Manage hotel reservations, including availability checks and cancellation policies.
- **Reviews**: Users can leave and view reviews for hotels.
- **Email Notifications**: Reservation confirmations sent via email using `nodemailer`.

## Tech Stack

- **Node.js**: Runtime environment for building server-side applications.
- **Express.js**: Web framework for routing and middleware.
- **TypeScript**: Strongly typed JavaScript for maintainable and error-free code.
- **MySQL**: Relational database for storing hotel, user, and reservation data.
- **MongoDB**: Non-relational database for storing users.
- **JWT**: JSON Web Token for secure authentication.
- **Nodemailer**: Email service for sending notifications.
- **dotenv**: Manage environment variables.

## Installation

### Prerequisites

- Node.js (v18 or later)
- MySQL Server
- MongoDB Server 

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/booking-clone-backend.git
   cd booking-clone-backend```

2. Install dependencies:
   ```npm install ```

3. Configure environment variables: Create a .env file in the root directory with the following variables:
   ```PORT=5000
   MYSQL_HOST=your-mysql-host
   MYSQL_USER=your-mysql-username
   MYSQL_PASSWORD=your-mysql-password
   MYSQL_DATABASE=your-database-name
   JWT_SECRET=your-secret-key
   EMAIL_USER=your-email
   EMAIL_PASS=your-email-password
   ```

4. Set up the database:
  * Use the provided SQL scripts to initialize the MySQL schema.
  * Run the seed scripts to populate sample data:
    ```bash
    npm run seed
```

5. Start the development server:
    ```bash
    npm run dev
```

6. Build and run the production server:
    ```bash
    npm run build
    npm start```

### API Endpoints
**Authentication**
* POST /api/auth/register: Register a new user.
* POST /api/auth/login: Login and receive a JWT.
  
**Hotels**
* GET /api/hotels: Fetch hotels with filters and pagination.
* POST /api/hotels: Add a new hotel (admin only).
* GET /api/hotels/:id: Get details of a specific hotel.
  
**Rooms**
* GET /api/rooms: Fetch available rooms for a hotel.
* POST /api/rooms: Add a new room to a hotel.
  
**Reservations**
* POST /api/reservations: Create a reservation.
* GET /api/reservations/:id: Get details of a reservation.

**Reviews**
* POST /api/reviews: Add a review for a hotel.
* GET /api/reviews/:hotelId: Fetch reviews for a hotel.
  
### Scripts
* npm run dev: Run the server in development mode with nodemon.
* npm run build: Compile the TypeScript code to JavaScript.
* npm start: Start the production server.
* npm run seed: Seed the database with initial data.
  
### Folder Structure
   ```bash
      src/
   ├── controllers/       # Define the business logic for API endpoints
   ├── routes/            # Define API routes
   ├── models/            # Database schemas and models
   ├── middleware/        # Custom middleware functions
   ├── utils/             # Utility functions (e.g., email notifications)
   ├── config/            # Database and environment configurations
   └── index.ts           # Entry point of the application 
```

### Future Improvements
   * Add real-time availability updates with WebSockets.
   * Implement other booking functionlities such as rent a car and book an attraction.



