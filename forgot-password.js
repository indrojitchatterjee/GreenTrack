const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");

const requestForm = document.getElementById("requestForm");
const requestMessage = document.getElementById("requestMessage");

const resetForm = document.getElementById("resetForm");
const resetMessage = document.getElementById("resetMessage");

let savedIdentifier = "";


// ==========================================
// STEP 1 — REQUEST OTP
// ==========================================

requestForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const identifier =
        document.getElementById("identifier").value.trim();

    const method =
        document.querySelector('input[name="method"]:checked').value;

    savedIdentifier = identifier;

    requestMessage.textContent = "Sending code...";
    requestMessage.style.color = "#aaa";

    try {

        const response = await fetch("/api/auth/forgot-password", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                identifier,
                method
            })

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Failed to send code."
            );

        }

        requestMessage.textContent = data.message;
        requestMessage.style.color = "#35e08c";

        setTimeout(() => {

            step1.style.display = "none";
            step2.style.display = "block";

        }, 800);

    } catch (error) {

        requestMessage.textContent = error.message;
        requestMessage.style.color = "#ff6b6b";

    }

});


// ==========================================
// STEP 2 — VERIFY OTP + SET NEW PASSWORD
// ==========================================

resetForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const otp =
        document.getElementById("otp").value.trim();

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmNewPassword =
        document.getElementById("confirmNewPassword").value;

    if (newPassword !== confirmNewPassword) {

        resetMessage.textContent = "Passwords do not match.";
        resetMessage.style.color = "#ff6b6b";
        return;

    }

    resetMessage.textContent = "Resetting password...";
    resetMessage.style.color = "#aaa";

    try {

        const response = await fetch("/api/auth/reset-password", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                identifier: savedIdentifier,
                otp,
                newPassword
            })

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Failed to reset password."
            );

        }

        resetMessage.textContent = data.message;
        resetMessage.style.color = "#35e08c";

        setTimeout(() => {

            window.location.href = "/login.html";

        }, 1200);

    } catch (error) {

        resetMessage.textContent = error.message;
        resetMessage.style.color = "#ff6b6b";

    }

});


// ==========================================
// START OVER
// ==========================================

document.getElementById("resendLink")
    .addEventListener("click", (e) => {

        e.preventDefault();

        step2.style.display = "none";
        step1.style.display = "block";

        resetMessage.textContent = "";

    });
