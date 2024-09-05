"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogle = verifyGoogle;
exports.signWithGoogle = signWithGoogle;
const jwt_decode_1 = require("jwt-decode");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model")); // Adjust the import if needed
const SALT_ROUNDS = 10;
const JWT_SECRET = "rtufhd@^^9jjic3$5695g,nlerlcvbnrer!!d,vby";
console.log("JWT_SECRET:", process.env.JWT);
async function verifyGoogle(req, res, next) {
    const { credential } = req.body;
    let credentialDecoded;
    try {
        credentialDecoded = (0, jwt_decode_1.jwtDecode)(credential);
        req.credentialDecoded = credentialDecoded;
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
    try {
        const { email } = credentialDecoded;
        let user = await user_model_1.default.findOne({ email });
        if (user) {
            req.user = user;
        }
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
    next();
}
async function signWithGoogle(req, res) {
    const { credentialDecoded } = req;
    if (!credentialDecoded)
        return res.status(500).json({ error: "Authentication with Google failed" });
    const { email, given_name: firstName, family_name: lastName, } = credentialDecoded;
    try {
        let user = req.user;
        if (!user) {
            // Generate a random password and hash it
            const hashedPassword = await bcryptjs_1.default.hash(Math.random().toString(36).slice(-8), SALT_ROUNDS);
            // Create a new user if one does not exist
            user = new user_model_1.default({
                email,
                firstName,
                lastName,
                displayName: `${firstName} ${lastName}`,
                password: hashedPassword,
            });
            await user.save();
        }
        // Create a JWT token for the user
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: "5h",
        });
        res.status(201).json({ token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Authentication with Google failed" });
    }
}
