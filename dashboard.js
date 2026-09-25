// ==========================================
// AUTHENTICATION
// ==========================================

const token =
    localStorage.getItem(
        "greentrack_token"
    );

const user =
    JSON.parse(
        localStorage.getItem(
            "greentrack_user"
        ) || "null"
    );


if (!token || !user) {

    window.location.href =
        "/login.html";

}


// ==========================================
// ELEMENT HELPER
// ==========================================

const $ = (id) =>
    document.getElementById(id);


// ==========================================
// USER
// ==========================================

$("welcome").textContent =
    `Hi, ${user.name || "User"}`;


// ==========================================
// AUTH HEADERS
// ==========================================

function getHeaders() {

    return {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${token}`

    };

}


// ==========================================
// MONEY FORMAT
// ==========================================

function money(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {

            style: "currency",

            currency: "INR",

            maximumFractionDigits: 2

        }
    ).format(
        Number(value) || 0
    );

}


// ==========================================
// TODAY
// ==========================================

const today =
    new Date();

const todayString =
    today.toISOString()
        .split("T")[0];


$("date").value =
    todayString;


$("budgetMonth").value =
    today.toISOString()
        .slice(0, 7);


// ==========================================
// VIEW BUDGET FOR A DIFFERENT MONTH
// ==========================================
// Just changing the month now refreshes the
// Budget / Spent / Remaining values — no need
// to click "Set Budget" (which would overwrite
// the budget amount) just to look at another month.

$("budgetMonth")
    .addEventListener(
        "change",
        () => {

            loadBudget();

        }
    );


// ==========================================
// API FUNCTION
// ==========================================

async function api(url, options = {}) {

    const response =
        await fetch(
            url,
            {

                ...options,

                headers: {
                    ...getHeaders(),
                    ...(options.headers || {})
                }

            }
        );


    const data =
        await response
            .json()
            .catch(() => ({}));


    if (
        response.status === 401 ||
        response.status === 403
    ) {

        localStorage.removeItem(
            "greentrack_token"
        );

        localStorage.removeItem(
            "greentrack_user"
        );

        window.location.href =
            "/login.html";

        throw new Error(
            "Session expired."
        );

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Something went wrong."
        );

    }


    return data;

}


// ==========================================
// LOAD SUMMARY
// ==========================================

async function loadSummary() {

    const data =
        await api(
            "/api/transactions/summary"
        );


    $("income").textContent =
        money(data.income);


    $("expense").textContent =
        money(data.expense);


    $("balance").textContent =
        money(data.balance);

}


// ==========================================
// LOAD TRANSACTIONS
// ==========================================

async function loadTransactions() {

    const data =
        await api(
            "/api/transactions"
        );


    const table =
        $("transactionTable");


    table.innerHTML = "";


    if (data.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#899b95;
                    "
                >

                    No transactions yet.

                </td>

            </tr>

        `;

        return;

    }


    data.forEach(transaction => {

        const row =
            document.createElement("tr");


        const isIncome =
            transaction.type ===
            "income";


        const sign =
            isIncome ? "+" : "-";


        const amountClass =
            isIncome
                ? "income"
                : "expense";


        row.innerHTML = `

            <td>
                ${transaction.date}
            </td>

            <td>
                ${isIncome
                    ? "Income"
                    : "Expense"}
            </td>

            <td>
                ${transaction.category}
            </td>

            <td>
                ${transaction.description || "-"}
            </td>

            <td class="${amountClass}">
                ${sign}${money(transaction.amount)}
            </td>

            <td>

                <button
                    class="delete-btn"
                    data-id="${transaction.id}"
                >
                    Delete
                </button>

            </td>

        `;


        table.appendChild(row);

    });


    // Delete buttons

    document
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (
                        !confirm(
                            "Delete this transaction?"
                        )
                    ) {

                        return;

                    }


                    try {

                        await api(
                            `/api/transactions/${id}`,
                            {
                                method:
                                    "DELETE"
                            }
                        );


                        await loadDashboard();

                    } catch (error) {

                        alert(
                            error.message
                        );

                    }

                }
            );

        });

}


// ==========================================
// ADD TRANSACTION
// ==========================================

$("transactionForm")
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const message =
                $("transactionMessage");


            message.textContent =
                "Saving transaction...";


            try {

                await api(
                    "/api/transactions",
                    {

                        method: "POST",

                        body:
                            JSON.stringify({

                                type:
                                    $("type").value,

                                category:
                                    $("category").value,

                                amount:
                                    $("amount").value,

                                date:
                                    $("date").value,

                                description:
                                    $("description")
                                        .value
                                        .trim()

                            })

                    }
                );


                message.textContent =
                    "✓ Transaction saved!";

                message.style.color =
                    "#35e08c";


                $("amount").value =
                    "";

                $("description").value =
                    "";


                await loadDashboard();


            } catch (error) {

                console.error(error);

                message.textContent =
                    error.message;

                message.style.color =
                    "#ff6b6b";

            }

        }
    );


// ==========================================
// CATEGORY CHART
// ==========================================

let categoryChart;


async function loadCategoryChart() {

    const data =
        await api(
            "/api/transactions/category-report"
        );


    const labels =
        data.map(
            item => item.category
        );


    const values =
        data.map(
            item =>
                Number(item.total)
        );


    if (categoryChart) {

        categoryChart.destroy();

    }


    categoryChart =
        new Chart(
            $("categoryChart"),
            {

                type:
                    "doughnut",

                data: {

                    labels,

                    datasets: [

                        {

                            data:
                                values

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );

}


// ==========================================
// MONTHLY CHART
// ==========================================

let monthlyChart;


async function loadMonthlyChart() {

    const data =
        await api(
            "/api/transactions/monthly-report"
        );


    const labels =
        data.map(
            item => item.month
        );


    const income =
        data.map(
            item =>
                Number(item.income)
        );


    const expense =
        data.map(
            item =>
                Number(item.expense)
        );


    if (monthlyChart) {

        monthlyChart.destroy();

    }


    monthlyChart =
        new Chart(
            $("monthlyChart"),
            {

                type:
                    "bar",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "Income",

                            data:
                                income

                        },

                        {

                            label:
                                "Expense",

                            data:
                                expense

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

}


// ==========================================
// SET BUDGET
// ==========================================

$("budgetForm")
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const message =
                $("budgetMessage");


            try {

                await api(
                    "/api/budgets",
                    {

                        method: "POST",

                        body:
                            JSON.stringify({

                                month:
                                    $("budgetMonth")
                                        .value,

                                amount:
                                    $("budgetAmount")
                                        .value

                            })

                    }
                );


                message.textContent =
                    "✓ Budget saved!";

                message.style.color =
                    "#35e08c";


                await loadBudget();


            } catch (error) {

                message.textContent =
                    error.message;

                message.style.color =
                    "#ff6b6b";

            }

        }
    );


// ==========================================
// LOAD BUDGET
// ==========================================

async function loadBudget() {

    const month =
        $("budgetMonth").value;


    if (!month) {

        return;

    }


    const data =
        await api(
            `/api/budgets?month=${encodeURIComponent(month)}`
        );


    $("budgetValue").textContent =
        money(data.budget);


    $("spentValue").textContent =
        money(data.spent);


    $("remainingValue").textContent =
        money(
            Math.max(
                Number(data.remaining),
                0
            )
        );


    const percentage =
        Math.min(
            Number(data.percentage) || 0,
            100
        );


    $("budgetProgress")
        .style.width =
        `${percentage}%`;


    const alert =
        $("budgetAlert");


    if (data.budget === 0) {

        alert.textContent =
            "Set a budget to start tracking.";

        alert.style.color =
            "#899b95";

    }

    else if (
        Number(data.percentage) >= 100
    ) {

        alert.textContent =
            "⚠ Budget exceeded!";

        alert.style.color =
            "#ff6b6b";

    }

    else if (
        Number(data.percentage) >= 80
    ) {

        alert.textContent =
            "⚠ You have used more than 80% of your budget.";

        alert.style.color =
            "#ffb86b";

    }

    else {

        alert.textContent =
            "✓ You are within your budget.";

        alert.style.color =
            "#35e08c";

    }

}


// ==========================================
// LOAD EVERYTHING
// ==========================================

async function loadDashboard() {

    try {

        await Promise.all([

            loadSummary(),

            loadTransactions(),

            loadCategoryChart(),

            loadMonthlyChart(),

            loadBudget()

        ]);

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// ==========================================
// LOGOUT
// ==========================================

$("logout")
    .addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "greentrack_token"
            );

            localStorage.removeItem(
                "greentrack_user"
            );


            window.location.href =
                "/login.html";

        }
    );


// ==========================================
// START
// ==========================================

loadDashboard();