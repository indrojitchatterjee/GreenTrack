const nodemailer = require("nodemailer");


// ==========================================
// EMAIL TRANSPORTER
// ==========================================
//
// TESTING MODE (default): uses Ethereal Email — a free fake
// SMTP inbox with no signup needed. Emails are NOT delivered
// to a real inbox; instead, a preview link is printed in your
// terminal so you can see the email and read the OTP there.
//
// To switch to REAL Gmail later: set USE_REAL_GMAIL=true in
// .env, plus EMAIL_USER and EMAIL_PASS (a Gmail App Password,
// generated at https://myaccount.google.com/apppasswords,
// which requires 2-Step Verification to be turned on first).

let transporterPromise = null;

function getTransporter() {

    if (transporterPromise) {

        return transporterPromise;

    }


    if (process.env.USE_REAL_GMAIL === "true") {

        transporterPromise = Promise.resolve(

            nodemailer.createTransport({

                service: "gmail",

                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }

            })

        );

    } else {

        // Ethereal: creates a temporary free test account automatically.

        transporterPromise =
            nodemailer.createTestAccount().then((testAccount) => {

                return nodemailer.createTransport({

                    host: "smtp.ethereal.email",

                    port: 587,

                    secure: false,

                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }

                });

            });

    }

    return transporterPromise;

}


// ==========================================
// SEND OTP EMAIL
// ==========================================

async function sendOtpEmail(toEmail, otp) {

    const transporter = await getTransporter();

    const info = await transporter.sendMail({

        from: `"GreenTrack" <${
            process.env.EMAIL_USER || "no-reply@greentrack.test"
        }>`,

        to: toEmail,

        subject: "GreenTrack Password Reset Code",

        html: `
            <div style="font-family: Arial, sans-serif; max-width: 420px;">
                <h2 style="color:#0d1c19;">GreenTrack Password Reset</h2>
                <p>Your one-time reset code is:</p>
                <p style="font-size:30px; font-weight:bold; letter-spacing:6px;">
                    ${otp}
                </p>
                <p>This code expires in 10 minutes.</p>
                <p style="color:#888; font-size:13px;">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `

    });


    if (process.env.USE_REAL_GMAIL !== "true") {

        // Print a clickable link to view the fake email in a browser —
        // this is where you'll read the OTP code during testing.

        console.log(
            "\n📧 TEST EMAIL SENT — view it here:",
            nodemailer.getTestMessageUrl(info),
            "\n"
        );

    }

}


module.exports = { sendOtpEmail };