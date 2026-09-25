const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");

const { sendOtpEmail } = require("../utils/mailer");
const { sendOtpSms } = require("../utils/sms");

// ==========================================
// CREATE JWT
// ==========================================

function createToken(user) {

    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "7d"
        }
    );
}


// ==========================================
// REGISTER
// ==========================================

exports.register = async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            password
        } = req.body;


        if (
            !name ||
            !email ||
            !phone ||
            !password
        ) {

            return res.status(400).json({
                message: "All fields are required."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });

        }


        const [existing] = await db.execute(
            `
            SELECT id
            FROM users
            WHERE email = ?
               OR phone = ?
            LIMIT 1
            `,
            [
                email,
                phone
            ]
        );


        if (existing.length > 0) {

            return res.status(409).json({
                message:
                    "Email or phone is already registered."
            });

        }


        const hashedPassword =
            await bcrypt.hash(password, 12);


        const [result] = await db.execute(
            `
            INSERT INTO users
            (name, email, phone, password)
            VALUES (?, ?, ?, ?)
            `,
            [
                name,
                email,
                phone,
                hashedPassword
            ]
        );


        return res.status(201).json({

            message:
                "Account created successfully.",

            userId:
                result.insertId

        });

    }

    catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        return res.status(500).json({

            message:
                "Server error while creating account."

        });

    }

};


// ==========================================
// LOGIN
// ==========================================

exports.login = async (req, res) => {

    try {

        const {
            identifier,
            password
        } = req.body;


        if (
            !identifier ||
            !password
        ) {

            return res.status(400).json({

                message:
                    "Login details are required."

            });

        }


        const [rows] = await db.execute(
            `
            SELECT
                id,
                name,
                email,
                phone,
                password
            FROM users
            WHERE name = ?
               OR email = ?
               OR phone = ?
            LIMIT 1
            `,
            [
                identifier,
                identifier,
                identifier
            ]
        );


        if (rows.length === 0) {

            return res.status(401).json({

                message:
                    "Invalid name, email, phone or password."

            });

        }


        const user = rows[0];


        const validPassword =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!validPassword) {

            return res.status(401).json({

                message:
                    "Invalid name, email, phone or password."

            });

        }


        const token =
            createToken(user);


        return res.json({

            message:
                "Login successful.",

            token,

            user: {

                id: user.id,

                name: user.name,

                email: user.email,

                phone: user.phone

            }

        });

    }

    catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        return res.status(500).json({

            message:
                "Server error while logging in."

        });

    }

};


// ==========================================
// FORGOT PASSWORD — REQUEST OTP
// ==========================================

exports.requestPasswordReset = async (req, res) => {

    try {

        const { identifier, method } = req.body;


        if (!identifier || !method) {

            return res.status(400).json({
                message:
                    "Email/phone and reset method are required."
            });

        }


        if (
            method !== "email" &&
            method !== "sms"
        ) {

            return res.status(400).json({
                message:
                    "Method must be 'email' or 'sms'."
            });

        }


        const [rows] = await db.execute(
            `
            SELECT id, name, email, phone
            FROM users
            WHERE email = ?
               OR phone = ?
            LIMIT 1
            `,
            [
                identifier,
                identifier
            ]
        );


        // Same message whether or not the account exists —
        // prevents leaking which emails/phones are registered.

        const genericMessage =
            `If an account exists, a reset code has been sent via ${
                method === "email" ? "email" : "SMS"
            }.`;


        if (rows.length === 0) {

            return res.json({
                message: genericMessage
            });

        }


        const user = rows[0];


        const otp =
            crypto.randomInt(100000, 999999)
                .toString();


        const expires =
            new Date(
                Date.now() + 10 * 60 * 1000
            ); // 10 minutes from now


        await db.execute(
            `
            UPDATE users
            SET reset_otp = ?,
                reset_otp_expires = ?
            WHERE id = ?
            `,
            [
                otp,
                expires,
                user.id
            ]
        );


        if (method === "email") {

            await sendOtpEmail(user.email, otp);

        } else {

            await sendOtpSms(user.phone, otp);

        }


        return res.json({
            message: genericMessage
        });

    }

    catch (error) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to send reset code. Please try again."

        });

    }

};


// ==========================================
// RESET PASSWORD — VERIFY OTP + SET NEW PASSWORD
// ==========================================

exports.resetPassword = async (req, res) => {

    try {

        const {
            identifier,
            otp,
            newPassword
        } = req.body;


        if (
            !identifier ||
            !otp ||
            !newPassword
        ) {

            return res.status(400).json({
                message:
                    "All fields are required."
            });

        }


        if (newPassword.length < 6) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });

        }


        const [rows] = await db.execute(
            `
            SELECT id, reset_otp, reset_otp_expires
            FROM users
            WHERE email = ?
               OR phone = ?
            LIMIT 1
            `,
            [
                identifier,
                identifier
            ]
        );


        if (rows.length === 0) {

            return res.status(400).json({
                message:
                    "Invalid or expired reset code."
            });

        }


        const user = rows[0];


        const isValidOtp =
            user.reset_otp &&
            user.reset_otp === otp &&
            user.reset_otp_expires &&
            new Date(user.reset_otp_expires) > new Date();


        if (!isValidOtp) {

            return res.status(400).json({
                message:
                    "Invalid or expired reset code."
            });

        }


        const hashedPassword =
            await bcrypt.hash(newPassword, 12);


        await db.execute(
            `
            UPDATE users
            SET password = ?,
                reset_otp = NULL,
                reset_otp_expires = NULL
            WHERE id = ?
            `,
            [
                hashedPassword,
                user.id
            ]
        );


        return res.json({
            message:
                "Password reset successfully. You can now log in."
        });

    }

    catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to reset password. Please try again."

        });

    }

};
