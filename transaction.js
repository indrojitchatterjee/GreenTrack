const express =
    require("express");

const router =
    express.Router();

const controller =
    require("../controllers/transactionController");

const authMiddleware =
    require("../middleware/authMiddleware");


// ADD

router.post(
    "/",
    authMiddleware,
    controller.addTransaction
);


// GET ALL

router.get(
    "/",
    authMiddleware,
    controller.getTransactions
);


// DELETE

router.delete(
    "/:id",
    authMiddleware,
    controller.deleteTransaction
);


// SUMMARY

router.get(
    "/summary",
    authMiddleware,
    controller.getSummary
);


// CATEGORY REPORT

router.get(
    "/category-report",
    authMiddleware,
    controller.getCategoryReport
);


// MONTHLY REPORT

router.get(
    "/monthly-report",
    authMiddleware,
    controller.getMonthlyReport
);


module.exports = router;