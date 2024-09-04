import express, { Request, Response } from "express";
import { getAccessToken } from "../paypalConfig";
import axios from "axios";

const paymentRoutes = express.Router();

paymentRoutes.post("/create-payment", async (req: Request, res: Response) => {
  const { totalAmount, currency } = req.body;

  try {
    const accessToken = await getAccessToken();
    const response = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: totalAmount,
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { id, links } = response.data;
    const approvalUrl = links.find((link: any) => link.rel === "approve")?.href;

    res.json({ id, approvalUrl });
  } catch (error) {
    res.status(500).send("Error creating PayPal payment");
  }
});

paymentRoutes.post("/capture-payment", async (req: Request, res: Response) => {
  const { orderId } = req.body;

  try {
    const accessToken = await getAccessToken();
    const response = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).send("Error capturing PayPal payment");
  }
});

export default paymentRoutes;
