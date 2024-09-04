"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paypalConfig_1 = require("../paypalConfig");
const axios_1 = __importDefault(require("axios"));
const paymentRoutes = express_1.default.Router();
paymentRoutes.post("/create-payment", async (req, res) => {
    const { totalAmount, currency } = req.body;
    try {
        const accessToken = await (0, paypalConfig_1.getAccessToken)();
        const response = await axios_1.default.post("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: currency,
                        value: totalAmount,
                    },
                },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
        const { id, links } = response.data;
        const approvalUrl = links.find((link) => link.rel === "approve")?.href;
        res.json({ id, approvalUrl });
    }
    catch (error) {
        res.status(500).send("Error creating PayPal payment");
    }
});
paymentRoutes.post("/capture-payment", async (req, res) => {
    const { orderId } = req.body;
    try {
        const accessToken = await (0, paypalConfig_1.getAccessToken)();
        const response = await axios_1.default.post(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {}, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
        res.json(response.data);
    }
    catch (error) {
        res.status(500).send("Error capturing PayPal payment");
    }
});
exports.default = paymentRoutes;
