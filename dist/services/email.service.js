"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReservationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: "Gmail", // or another email service provider
    auth: {
        user: "kugelomer@gmail.com",
        pass: "emih qmid xgvd aflc",
    },
});
const sendReservationEmail = async (reservationDetails) => {
    const mailOptions = {
        from: "kugelomer@gmail.com",
        to: reservationDetails.email,
        subject: "Your Reservation Confirmation",
        html: `
      <h1>Reservation Confirmation</h1>
      <p>Thank you for your reservation. Here are your details:</p>
      <ul>
        <li><strong>Hotel:</strong> ${reservationDetails.hotelName}</li>
        <li><strong>Start Date:</strong> ${reservationDetails.startDate}</li>
        <li><strong>End Date:</strong> ${reservationDetails.endDate}</li>
        <li><strong>Rooms Reserved:</strong> ${reservationDetails.roomsForReservation}</li>
      </ul>
      <p>Please make sure to check your email for any further updates or cancellations.</p>
      <p>Best regards,</p>
      <strong>Bookin.com</strong>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    }
    catch (error) {
        console.error("Error sending email:", error);
    }
};
exports.sendReservationEmail = sendReservationEmail;
