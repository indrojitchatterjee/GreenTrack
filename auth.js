const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const {
    register,
    login,
    requestPasswordReset,
    resetPassword
} = require("../controllers/authController");


// ==========================================
// RATE LIMITERS
// ==========================================
// Protects against spam, cost abuse (email/SMS sending),
// and brute-force OTP guessing once the app is public.

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,                    // 10 attempts per IP per window
    message: {
        message: "Too many login attempts. Please try again in 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 5,                     // 5 accounts per IP per hour
    message: {
        message: "Too many accounts created from this network. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const requestResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 3,                     // 3 OTP requests per IP per window
    message: {
        message: "Too many reset requests. Please wait 15 minutes and try again."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const verifyResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 8,                     // 8 OTP verification attempts per IP per window
    message: {
        message: "Too many attempts. Please request a new code."
    },
    standardHeaders: true,
    legacyHeaders: false
});


router.post(
    "/register",
    registerLimiter,
    register
);


router.post(
    "/login",
    loginLimiter,
    login
);


router.post(
    "/forgot-password",
    requestResetLimiter,
    requestPasswordReset
);


router.post(
    "/reset-password",
    verifyResetLimiter,
    resetPassword
);


module.exports = router;