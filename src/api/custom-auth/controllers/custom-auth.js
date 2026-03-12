"use strict";

const axios = require("axios");
const { ValidationError } = require("@strapi/utils").errors;
const constants = require("../../../helpers/constants");

module.exports = {
    async providerLogin(ctx) {
        try {
            const { domain, destination_uri } = ctx.query;

            const tenant_id = process.env.AZURE_AD_TENANT_ID;
            const client_id = process.env.AZURE_AD_CLIENT_ID;

            if (!tenant_id || !client_id) {
                throw new ValidationError("Azure AD configuration is missing on the server.");
            }

            const state = Buffer.from(JSON.stringify({ domain, destination_uri })).toString("base64");
            const authorizeUrl = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/authorize`;

            const params = new URLSearchParams({
                client_id: client_id,
                response_type: "code",
                redirect_uri: constants.apis.providerCallback,
                scope: "https://graph.microsoft.com/.default offline_access openid profile email",
                response_mode: "query",
                state,
                prompt: "select_account",
            });

            ctx.redirect(`${authorizeUrl}?${params.toString()}`);
        } catch (error) {
            console.log("An error occurred (custom providerLogin):", error?.message || error);
            ctx.badRequest(error);
        }
    },

    async providerCallback(ctx) {
        try {
            const { code, state } = ctx.query;

            if (!code || !state) {
                throw new ValidationError("'code', and 'state' are required.");
            }

            const { destination_uri } = JSON.parse(Buffer.from(state, "base64").toString("utf8"));

            const tenant_id = process.env.AZURE_AD_TENANT_ID;
            const client_id = process.env.AZURE_AD_CLIENT_ID;
            const client_secret = process.env.AZURE_AD_CLIENT_SECRET;

            const tokenUrl = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`;
            const response = await axios.post(
                tokenUrl,
                new URLSearchParams({
                    client_id,
                    client_secret,
                    scope: "https://graph.microsoft.com/.default offline_access",
                    code,
                    redirect_uri: constants.apis.providerCallback,
                    grant_type: "authorization_code",
                }).toString(),
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    timeout: 15000,
                }
            );

            const tokens = response?.data;
            const accessToken = tokens?.access_token;

            const userResp = await axios.get("https://graph.microsoft.com/v1.0/me", {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 15000,
            });

            const userInfo = userResp?.data;
            const email = userInfo.mail || userInfo.userPrincipalName;

            let user = await strapi.query("plugin::users-permissions.user").findOne({ where: { email } });

            if (!user) {
                const defaultRole = await strapi.query("plugin::users-permissions.role").findOne({ where: { type: "authenticated" } });
                user = await strapi.query("plugin::users-permissions.user").create({
                    data: {
                        username: email,
                        email: email,
                        provider: 'microsoft',
                        confirmed: true,
                        blocked: false,
                        role: defaultRole?.id || 1,
                    }
                });
            }

            const jwt = strapi.service("plugin::users-permissions.jwt").issue({ id: user.id });

            try {
                await strapi.query("api::sso-detail.sso-detail").create({
                    data: {
                        user_id: userInfo.id,
                        login_information: {
                            microsoft_tokens: tokens,
                            microsoft_user_info: userInfo,
                            login_timestamp: new Date().toISOString(),
                            auth_method: 'Azure AD SSO'
                        },
                        created_at: new Date(),
                        publishedAt: new Date()
                    }
                });
            } catch (ssoError) {
                console.error("Failed to store SSO details:", ssoError.message);
            }

            const envFrontendUrl = process.env.FRONTEND_URL || 'localhost:3000';
            const frontendUrl = envFrontendUrl.startsWith('http') ? envFrontendUrl : `http://${envFrontendUrl}`;
            
            const redirectBase = destination_uri || `${frontendUrl}/dashboard`;
            const separator = redirectBase.includes('?') ? '&' : '?';
            const redirectWithToken = `${redirectBase}${separator}token=${jwt}`;

            ctx.redirect(redirectWithToken);
        } catch (error) {
            console.log("An error occurred (custom providerCallback):", error?.message || error);
            ctx.badRequest(error);
        }
    },

    async sendOTP(ctx) {
        try {
            const { email } = ctx.request.body;
            if (!email) throw new ValidationError("Email is required");

            const user = await strapi.query("plugin::users-permissions.user").findOne({ where: { email } });
            if (!user) throw new ValidationError("User not found");

            const otp = Math.floor(100000 + Math.random() * 900000);
            const expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + 5);

            await strapi.query("plugin::users-permissions.user").update({
                where: { id: user.id },
                data: { otp, otp_expiry: expiry },
            });

            try {
                const emailService = strapi.plugin('email').service('email');
                await emailService.send({
                    to: email,
                    from: process.env.STRAPI_ADMIN_EMAIL_FROM || "no-reply@crusadersterling.com",
                    replyTo: process.env.STRAPI_ADMIN_EMAIL_REPLY_TO || process.env.STRAPI_ADMIN_EMAIL_FROM || "support@crusadersterling.com",
                    subject: "CrusaderSterling - Your Verification Code",
                    text: `Dear User,\n\nYour verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please contact our support team immediately.\n\nBest regards,\nCrusaderSterling\nPension Fund Administrator`,
                    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f5f5;">
        <tr><td style="padding:32px 30px;">
            <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.5;">Dear User,</p>
            <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.5;">Please use the verification code below to complete your login:</p>
            <table role="presentation" style="width:100%;margin:0 0 24px;">
                <tr><td align="center">
                    <div style="background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);border:2px solid #3B82F6;border-radius:12px;padding:22px 28px;display:inline-block;">
                        <p style="margin:0 0 8px;color:#1e40af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">YOUR VERIFICATION CODE</p>
                        <div style="font-size:38px;font-weight:700;color:#1e3a8a;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</div>
                    </div>
                </td></tr>
            </table>
            <table role="presentation" style="width:100%;background-color:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;margin:0 0 20px;">
                <tr><td style="padding:14px 18px;">
                    <p style="margin:0 0 8px;color:#92400E;font-size:13px;font-weight:600;">⏱️ Important:</p>
                    <ul style="margin:0;padding-left:20px;color:#78350F;font-size:13px;line-height:1.6;">
                        <li style="margin-bottom:4px;">This code expires in <strong>5 minutes</strong></li>
                        <li>Do not share this code with anyone</li>
                    </ul>
                </td></tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">If you did not request this code, please contact our support team immediately.</p>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:22px 30px;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 12px;color:#4b5563;font-size:13px;text-align:center;">
                <strong>Need Help?</strong><br>
                <a href="mailto:support@crusadersterling.com" style="color:#3B82F6;text-decoration:none;">support@crusadersterling.com</a>
            </p>
            <hr style="border:0;border-top:1px solid #e5e7eb;margin:14px 0;">
            <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;line-height:1.5;">
                © ${new Date().getFullYear()} CrusaderSterling Pensions Limited. All rights reserved.<br>
                <span style="font-size:10px;color:#b0b7c3;">This is an automated message. Please do not reply to this email.</span>
            </p>
        </td></tr>
    </table>
</body>
</html>`,
                });
            } catch (emailError) {
                console.error("Failed to send OTP email:", emailError.message);
            }

            return ctx.send({ success: true, message: "OTP sent to your email", expiry });
        } catch (error) {
            console.error("An error occurred (sendOTP):", error?.message || error);
            ctx.badRequest(error.message);
        }
    },

    async verifyOTP(ctx) {
        try {
            const { email, otp } = ctx.request.body;
            if (!email || !otp) throw new ValidationError("Email and OTP are required");

            const user = await strapi.query("plugin::users-permissions.user").findOne({ where: { email } });
            if (!user) throw new ValidationError("User not found");

            console.log("=== OTP DEBUG LOG ===");
            console.log(`Received OTP: ${otp} (type: ${typeof otp})`);
            console.log(`Stored OTP: ${user.otp} (type: ${typeof user.otp})`);
            console.log(`Stored Expiry: ${user.otp_expiry}`);
            
            if (!user.otp || String(user.otp) !== String(otp)) {
                console.log("OTP Mismatch detected");
                throw new ValidationError("Invalid verification code");
            }

            const now = new Date();
            console.log(`Current Time: ${now.toISOString()}`);
            if (user.otp_expiry && new Date(user.otp_expiry) < now) {
                console.log("OTP Expired");
                throw new ValidationError("Verification code has expired");
            }
            console.log("=== End OTP DEBUG LOG ===");

            // Issue JWT so the frontend can store it after OTP success
            const jwt = strapi.service("plugin::users-permissions.jwt").issue({ id: user.id });

            // Clear OTP after successful use
            await strapi.query("plugin::users-permissions.user").update({
                where: { id: user.id },
                data: { otp: null, otp_expiry: null },
            });

            return ctx.send({
                success: true,
                message: "OTP verified successfully",
                jwt,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                }
            });
        } catch (error) {
            console.error("An error occurred (verifyOTP):", error?.message || error);
            ctx.badRequest(error.message);
        }
    },

    async register(ctx) {
        try {
            const { username, email, password } = ctx.request.body;
            if (!username || !email || !password) {
                throw new ValidationError("Username, email, and password are required");
            }

            const existingUser = await strapi.query("plugin::users-permissions.user").findOne({
                where: { $or: [{ email }, { username }] },
            });

            if (existingUser) {
                throw new ValidationError("Email or username is already taken");
            }

            const defaultRole = await strapi.query("plugin::users-permissions.role").findOne({
                where: { type: "authenticated" }
            });

            const newUser = await strapi.plugin('users-permissions').service('user').add({
                username,
                email,
                password,
                provider: 'local',
                confirmed: true,
                blocked: false,
                role: defaultRole?.id || 1,
            });

            // Don't issue a JWT here since they still need to verify OTP later via login
            return ctx.send({
                success: true,
                message: "Account created successfully",
                user: { id: newUser.id, username: newUser.username, email: newUser.email }
            });
        } catch (error) {
            console.error("An error occurred (register):", error?.message || error);
            ctx.badRequest(error.message);
        }
    },

    async login(ctx) {
        try {
            const { identifier, password } = ctx.request.body;
            if (!identifier || !password) throw new ValidationError("Identifier and password are required");

            const user = await strapi.query("plugin::users-permissions.user").findOne({
                where: { $or: [{ email: identifier }, { username: identifier }] },
                populate: ['role']
            });

            if (!user) throw new ValidationError("Invalid credentials");
            if (user.blocked) throw new ValidationError("Your account has been blocked");

            const validPassword = await strapi.plugin('users-permissions').service('user').validatePassword(
                password,
                user.password
            );
            if (!validPassword) throw new ValidationError("Invalid credentials");

            // Bypass OTP for Admins
            if (user.role && (user.role.name === 'Admin' || user.role.type === 'admin')) {
                const jwt = strapi.service("plugin::users-permissions.jwt").issue({ id: user.id });
                return ctx.send({
                    success: true,
                    message: "Login successful",
                    jwt,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        role: user.role.name
                    }
                });
            }

            return ctx.send({ success: true, message: "Login successful", email: user.email });
        } catch (error) {
            console.error("An error occurred (login):", error?.message || error);
            ctx.badRequest(error.message);
        }
    },

    async resetPassword(ctx) {
        try {
            const { email, otp, password } = ctx.request.body;
            if (!email || !otp || !password) throw new ValidationError("Email, OTP, and new password are required");

            const user = await strapi.query("plugin::users-permissions.user").findOne({ where: { email } });
            if (!user) throw new ValidationError("User not found");

            if (!user.otp || String(user.otp) !== String(otp)) {
                throw new ValidationError("Invalid or expired verification code");
            }

            const now = new Date();
            if (user.otp_expiry && new Date(user.otp_expiry) < now) {
                throw new ValidationError("Verification code has expired");
            }

            const isSamePassword = await strapi.plugin('users-permissions').service('user').validatePassword(
                password, user.password
            );
            if (isSamePassword) throw new ValidationError("New password cannot be the same as your old password.");

            await strapi.service("plugin::users-permissions.user").edit(user.id, {
                password,
                otp: null,
                otp_expiry: null,
            });

            return ctx.send({ success: true, message: "Password reset successfully" });
        } catch (error) {
            console.error("An error occurred (resetPassword):", error?.message || error);
            ctx.badRequest(error.message);
        }
    },
};
