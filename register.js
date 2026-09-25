const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    // Check password
    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        message.style.color = "#ff6b6b";
        return;
    }

    message.textContent = "Creating account...";
    message.style.color = "#aaa";

    try {

        const response = await fetch("/api/auth/register", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email,
                phone: phone,
                password: password
            })
        });

        // IMPORTANT:
        // Read response as text first
        const text = await response.text();

        console.log("Response status:", response.status);
        console.log("Response:", text);

        let data = {};

        // Only parse JSON if something was returned
        if (text.trim() !== "") {

            try {
                data = JSON.parse(text);

            } catch (error) {

                console.error(
                    "Invalid JSON from server:",
                    text
                );

                throw new Error(
                    "Server returned an invalid response."
                );
            }
        }

        // Check HTTP status
        if (!response.ok) {

            throw new Error(
                data.message ||
                `Registration failed. Status: ${response.status}`
            );
        }

        // Success
        message.textContent =
            data.message ||
            "Account created successfully.";

        message.style.color = "#35e08c";

        form.reset();

        // Go to login
        setTimeout(() => {
            window.location.href = "/login.html";
        }, 1000);

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        message.textContent =
            error.message ||
            "Something went wrong.";

        message.style.color = "#ff6b6b";
    }
});