import nodemailer from "nodemailer";

interface ReservationDetails {
  hotelID: number;
  roomID: number;
  email: string;
  startDate: string | null;
  endDate: string | null;
  roomsForReservation: number;
  hotelName: string;
}

const transporter = nodemailer.createTransport({
  service: "Gmail", // or another email service provider
  auth: {
    user: "kugelomer@gmail.com",
    pass: "emih qmid xgvd aflc",
  },
});

export const sendReservationEmail = async (
  reservationDetails: ReservationDetails
): Promise<void> => {
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
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
