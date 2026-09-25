const twilio = require("twilio");


// ==========================================
// TWILIO CLIENT (created lazily)
// ==========================================
// Sign up at https://www.twilio.com/try-twilio
// Get SID, Auth Token, and a Twilio phone number
// from your Twilio console, and put them in .env.
// Trial accounts can only SMS phone numbers you've
// manually verified in the Twilio console.
//
// The client is only created when an SMS is actually
// sent, so a missing/invalid TWILIO_SID does NOT crash
// the whole server on startup — it only fails the SMS
// reset option specifically, until you add real keys.

function getClient() {

    if (
        !process.env.TWILIO_SID ||
        !process.env.TWILIO_SID.startsWith("AC")
    ) {

        throw new Error(
            "SMS reset is not configured yet. Please use the Email option, or contact support."
        );

    }

    return twilio(
        process.env.TWILIO_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

}


// ==========================================
// SEND OTP SMS
// ==========================================
// Adjust the country code below (+91 = India) to match
// how phone numbers are stored in your users table.

async function sendOtpSms(toPhone, otp) {

    const client = getClient();

    const formattedPhone =
        toPhone.startsWith("+")
            ? toPhone
            : `+91${toPhone}`;

    await client.messages.create({

        body:
            `Your GreenTrack password reset code is ${otp}. It expires in 10 minutes.`,

        from: process.env.TWILIO_PHONE,

        to: formattedPhone

    });

}


module.exports = { sendOtpSms };