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
- **Mongoose**: Object Data Modeling (ODM) for MongoDB (for specific features, like reviews).
- **JWT**: JSON Web Token for secure authentication.
- **Nodemailer**: Email service for sending notifications.
- **dotenv**: Manage environment variables.

## Installation

### Prerequisites

- Node.js (v18 or later)
- MySQL Server
- MongoDB Server (optional, if used for reviews)

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
