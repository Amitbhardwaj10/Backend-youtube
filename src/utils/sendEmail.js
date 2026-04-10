import { ApiError } from "./ApiError.js";
import nodemailer from "nodemailer";

const sendVerificationEmail = async (user, verificationToken) => {
    if (!verificationToken)
        throw new Error("Verification token is required to send email");

    const verificationURL = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        },
    });

    const mailOptions = {
        from: `"VideoTube" <${process.env.EMAIL}>`,
        to: user.email,
        subject: "Verify your email — VideoTube",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">

            <div style="background: #1a1a2e; padding: 2rem; text-align: center;">
                <p style="font-size: 22px; font-weight: 600; color: #ffffff; margin: 0;">▶️ VideoTube</p>
            </div>

            <div style="padding: 2rem 2.5rem;">
                <p style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 0.5rem;">Verify your email</p>
                <p style="font-size: 14px; color: #666; margin: 0 0 1.5rem;">
                    Hi <strong>${user.fullname}</strong>, thanks for signing up. Click the button below to verify your email address and activate your account.
                </p>

                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <a href="${verificationURL}" 
                       style="display: inline-block; background: #1a1a2e; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 500;">
                        Verify my email
                    </a>
                </div>

                <div style="background: #f5f5f5; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
                    <p style="font-size: 12px; color: #888; margin: 0 0 0.4rem;">Or copy and paste this link into your browser:</p>
                    <p style="font-size: 12px; color: #4a90d9; margin: 0; word-break: break-all;">${verificationURL}</p>
                </div>

                <div style="border-top: 1px solid #e0e0e0; padding-top: 1.25rem;">
                    <p style="font-size: 12px; color: #888; margin: 0 0 0.5rem;">⏱ This link expires in <strong>15 minutes</strong> for your security.</p>
                    <p style="font-size: 12px; color: #888; margin: 0;">If you didn't create an account, you can safely ignore this email.</p>
                </div>
            </div>

            <div style="background: #f5f5f5; padding: 1rem 2.5rem; border-top: 1px solid #e0e0e0; text-align: center;">
                <p style="font-size: 12px; color: #888; margin: 0;">© 2026 VideoTube. All rights reserved.</p>
                <p style="font-size: 12px; color: #888; margin: 0.25rem 0 0;">123 Hotel  Street, City, Country</p>
            </div>

        </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Verification email sent: %s", info.messageId);
    } catch (error) {
        throw new ApiError(
            400,
            "Failed to send verification email. Please try again later.",
            error
        );
    }
};

export { sendVerificationEmail };
