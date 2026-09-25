const db = require("../db");


// ==========================================
// ADD TRANSACTION
// ==========================================

exports.addTransaction = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            type,
            category,
            amount,
            date,
            description
        } = req.body;


        if (
            !type ||
            !category ||
            !amount ||
            !date
        ) {

            return res.status(400).json({
                message: "Please fill all required fields."
            });

        }


        if (
            type !== "income" &&
            type !== "expense"
        ) {

            return res.status(400).json({
                message: "Invalid transaction type."
            });

        }


        if (Number(amount) <= 0) {

            return res.status(400).json({
                message: "Amount must be greater than 0."
            });

        }


        const [result] = await db.execute(

            `
            INSERT INTO transactions
            (
                user_id,
                type,
                category,
                amount,
                date,
                description
            )

            VALUES (?, ?, ?, ?, ?, ?)
            `,

            [
                userId,
                type,
                category,
                amount,
                date,
                description || null
            ]

        );


        res.status(201).json({

            message:
                "Transaction added successfully.",

            id:
                result.insertId

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to add transaction."
        });

    }

};



// ==========================================
// GET TRANSACTIONS
// ==========================================

exports.getTransactions = async (req, res) => {

    try {

        const userId = req.user.id;


        const [rows] = await db.execute(

            `
            SELECT
                id,
                type,
                category,
                amount,
                date,
                description,
                created_at

            FROM transactions

            WHERE user_id = ?

            ORDER BY date DESC, id DESC
            `,

            [userId]

        );


        res.json(rows);


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to load transactions."
        });

    }

};



// ==========================================
// DELETE TRANSACTION
// ==========================================

exports.deleteTransaction = async (req, res) => {

    try {

        const userId = req.user.id;

        const transactionId =
            req.params.id;


        const [result] =
            await db.execute(

                `
                DELETE FROM transactions

                WHERE id = ?

                AND user_id = ?
                `,

                [
                    transactionId,
                    userId
                ]

            );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                message:
                    "Transaction not found."

            });

        }


        res.json({

            message:
                "Transaction deleted successfully."

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to delete transaction."

        });

    }

};



// ==========================================
// DASHBOARD SUMMARY
// ==========================================

exports.getSummary = async (req, res) => {

    try {

        const userId =
            req.user.id;


        const [rows] =
            await db.execute(

                `
                SELECT

                    COALESCE(
                        SUM(
                            CASE
                            WHEN type = 'income'
                            THEN amount
                            ELSE 0
                            END
                        ),
                        0
                    ) AS income,

                    COALESCE(
                        SUM(
                            CASE
                            WHEN type = 'expense'
                            THEN amount
                            ELSE 0
                            END
                        ),
                        0
                    ) AS expense

                FROM transactions

                WHERE user_id = ?
                `,

                [userId]

            );


        const income =
            Number(rows[0].income);

        const expense =
            Number(rows[0].expense);


        const balance =
            income - expense;


        res.json({

            income,
            expense,
            balance

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to load summary."

        });

    }

};



// ==========================================
// CATEGORY REPORT
// ==========================================

exports.getCategoryReport = async (req, res) => {

    try {

        const userId =
            req.user.id;


        const [rows] =
            await db.execute(

                `
                SELECT

                    category,

                    SUM(amount) AS total

                FROM transactions

                WHERE user_id = ?

                AND type = 'expense'

                GROUP BY category

                ORDER BY total DESC
                `,

                [userId]

            );


        res.json(rows);


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to load category report."

        });

    }

};



// ==========================================
// MONTHLY REPORT
// ==========================================

exports.getMonthlyReport = async (req, res) => {

    try {

        const userId =
            req.user.id;


        const [rows] =
            await db.execute(

                `
                SELECT

                    DATE_FORMAT(date, '%Y-%m')
                    AS month,

                    SUM(
                        CASE
                        WHEN type = 'income'
                        THEN amount
                        ELSE 0
                        END
                    ) AS income,

                    SUM(
                        CASE
                        WHEN type = 'expense'
                        THEN amount
                        ELSE 0
                        END
                    ) AS expense

                FROM transactions

                WHERE user_id = ?

                GROUP BY
                    DATE_FORMAT(date, '%Y-%m')

                ORDER BY month ASC
                `,

                [userId]

            );


        res.json(rows);


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to load monthly report."

        });

    }

};