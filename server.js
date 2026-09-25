const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ==========================================
// SERVE PUBLIC FRONTEND
// ==========================================

app.use(
    express.static(
        path.join(__dirname, "..", "Public")
    )
);

// ==========================================
// AUTH ROUTES
// ==========================================

const authRoutes = require("./routes/auth");

app.use(
    "/api/auth",
    authRoutes
);


// ==========================================
// TRANSACTION & BUDGET ROUTES   ← NEW
// ==========================================

const transactionRoutes = require("./routes/transaction");
const budgetRoutes = require("./routes/budget");

app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);


// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "..",
            "Public",
            "login.html"
        )
    );

});


// ==========================================
// TEST SERVER
// ==========================================

app.get("/api/health", (req, res) => {

    res.json({
        status: "OK",
        message: "GreenTrack server is running."
    });

});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `GreenTrack running at http://localhost:${PORT}`
    );

});