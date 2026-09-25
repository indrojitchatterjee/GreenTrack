const db = require("../db");


// ==========================================
// SET / UPDATE BUDGET
// ==========================================

exports.setBudget = async (req, res) => {

    try {

        const userId =
            req.user.id;

        const {
            month,
            amount
        } = req.body;


        if (!month || !amount) {

            return res.status(400).json({

                message:
                    "Month and amount are required."

            });

        }


        if (Number(amount) <= 0) {

            return res.status(400).json({

                message:
                    "Budget must be greater than 0."

            });

        }


        await db.execute(

            `
            INSERT INTO budgets
            (
                user_id,
                month,
                amount
            )

            VALUES (?, ?, ?)

            ON DUPLICATE KEY UPDATE
                amount = VALUES(amount)
            `,

            [
                userId,
                month,
                amount
            ]

        );


        res.json({

            message:
                "Budget saved successfully."

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to save budget."

        });

    }

};



// ==========================================
// GET CURRENT BUDGET
// ==========================================

exports.getBudget = async (req, res) => {

    try {

        const userId =
            req.user.id;


        const month =
            req.query.month;


        if (!month) {

            return res.status(400).json({

                message:
                    "Month is required."

            });

        }


        const [budgetRows] =
            await db.execute(

                `
                SELECT amount

                FROM budgets

                WHERE user_id = ?

                AND month = ?

                LIMIT 1
                `,

                [
                    userId,
                    month
                ]

            );


        const budget =
            budgetRows.length
                ? Number(budgetRows[0].amount)
                : 0;


        const [expenseRows] =
            await db.execute(

                `
                SELECT

                    COALESCE(
                        SUM(amount),
                        0
                    ) AS spent

                FROM transactions

                WHERE user_id = ?

                AND type = 'expense'

                AND DATE_FORMAT(
                    date,
                    '%Y-%m'
                ) = ?
                `,

                [
                    userId,
                    month
                ]

            );


        const spent =
            Number(
                expenseRows[0].spent
            );


        const remaining =
            budget - spent;


        const percentage =
            budget > 0
                ? (spent / budget) * 100
                : 0;


        res.json({

            month,

            budget,

            spent,

            remaining,

            percentage

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to load budget."

        });

    }

};

module.exports = exports;