"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const mysql2_1 = require("mysql2");
const cors_1 = __importDefault(require("cors"));
const hotels_routes_1 = __importDefault(require("./routes/hotels.routes"));
const reservations_route_1 = __importDefault(require("./routes/reservations.route"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const reviews_routes_1 = __importDefault(require("./routes/reviews.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const caCertPath = process.env.CA_CERTIFICATE_PATH;
if (!caCertPath) {
    throw new Error("CA_CERTIFICATE_PATH is not defined in the environment variables");
}
const caCert = fs_1.default.readFileSync(caCertPath);
exports.db = (0, mysql2_1.createConnection)({
    host: process.env.AIVAN_HOST,
    user: process.env.AIVAN_USERNAME,
    password: process.env.AIVAN_PASSWORD,
    database: process.env.AIVAN_DB,
    connectTimeout: 30000,
    port: parseInt(process.env.SQLPORT || "20285"),
    ssl: {
        ca: caCert,
        rejectUnauthorized: true,
    },
});
async function main() {
    exports.db.connect((err) => {
        if (err) {
            console.error("Error connecting to the MySQL database:", err);
        }
        else {
            console.log("Successfully connected to the MySQL database");
        }
    });
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    // Connect to MongoDB
    const connect = async () => {
        try {
            await mongoose_1.default.connect(process.env.MONGO_URI);
            console.log("Connected to MongoDB.");
        }
        catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            throw error;
        }
    };
    mongoose_1.default.connection.on("disconnected", () => {
        console.log("MongoDB disconnected!");
    });
    // Middlewares
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Routes
    app.use("/api/auth", auth_routes_1.default);
    app.use("/api/users", users_routes_1.default);
    app.use("/api/hotels", hotels_routes_1.default);
    app.use("/api/reservations", auth_middleware_1.verifyToken, reservations_route_1.default);
    app.use("/api/reviews", auth_middleware_1.verifyToken, reviews_routes_1.default);
    app.use("/api/paypal", payment_routes_1.default);
    // Centralized Error Handling Middleware
    app.use((err, req, res, next) => {
        const status = err.status || 500;
        const message = err.message || "Something went wrong";
        res.status(status).json({
            success: false,
            status,
            message,
        });
    });
    connect();
}
main();
