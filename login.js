const form = document.getElementById("loginForm");
const message = document.getElementById("message");

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {

    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    togglePassword.textContent = isPassword ? "🙈" : "👁";

});


form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identifier =
        document.getElementById("identifier").value.trim();

    const password =
        document.getElementById("password").value;

    message.textContent = "Logging in...";
    message.style.color = "#999";

    try {

        const response = await fetch("/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                identifier: identifier,
                password: password
            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Login failed"
            );

        }


        // Save login information

        localStorage.setItem(
            "greentrack_token",
            data.token
        );


        localStorage.setItem(
            "greentrack_user",
            JSON.stringify(data.user)
        );


        message.textContent =
            "Login successful!";

        message.style.color =
            "#35e08c";


        setTimeout(() => {

            window.location.href =
                "/dashboard.html";

        }, 500);


    } catch (error) {

        console.error(error);

        message.textContent =
            error.message;

        message.style.color =
            "#ff6b6b";

    }

});