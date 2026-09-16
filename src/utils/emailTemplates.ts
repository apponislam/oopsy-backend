import { sendMail } from "./nodemailer";
import config from "../app/config/index";

export const sendVerificationEmail = (email: string, name: string, verificationUrl: string, otp?: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 24px; background: white; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); box-sizing: border-box;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Hello ${name},</h2>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" target="_blank" style="background-color: #0B6E7F; background-image: linear-gradient(to right, #0B6E7F, #0ea5e9); color: #ffffff !important; padding: 12px 30px; text-decoration: none !important; border-radius: 24px; display: inline-block; font-weight: 500; font-size: 14px; text-align: center; border: none;">Verify Email</a>
            </div>
            <p style="color: #8a8a8a; font-size: 12px; line-height: 1.6; word-break: break-all;">Or copy this link: <span style="word-break: break-all;">${verificationUrl}</span></p>
            ${""/*
                otp
                    ? `<div style="margin-top: 24px; padding: 16px; background: #fffaf0; border-radius: 8px; border: 1px solid #ffe8b8;">
                        <p style="color: #0B6E7F; font-size: 14px; text-align: center; margin: 0 0 8px 0;">Or enter this 6-digit code in the app:</p>
                        <p style="color: #1a1a1a; font-size: 28px; text-align: center; margin: 0; font-weight: bold; letter-spacing: 6px;">${otp}</p>
                        <p style="color: #8a8a8a; font-size: 12px; text-align: center; margin: 8px 0 0 0;">OTP expires in 10 minutes.</p>
                       </div>`
                    : ""
            */}
            <p style="color: #8a8a8a; font-size: 12px; margin-top: 24px;">This link expires in 24 hours.</p>
        </div>
    `;
    sendMail(email, "Verify Your Email", html);
};

export const sendOtpEmail = (email: string, otp: string, name?: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 420px; margin: 0 auto; padding: 24px; background: white; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); box-sizing: border-box;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">${name ? `Hello ${name},` : "Hello,"}</h2>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">Your OTP code is:</p>
            <div style="background: #fffaf0; border: 1px solid #ffe8b8; padding: 20px; text-align: center; margin: 24px 0; border-radius: 12px;">
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">
                    ${otp}
                </div>
            </div>
            <p style="color: #8a8a8a; font-size: 12px;">This code expires in 10 minutes.</p>
        </div>
    `;
    sendMail(email, "Your OTP Code", html);
};

export const sendWelcomeEmail = (email: string, name: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 520px; margin: 0 auto; padding: 0; background: white; border: 1px solid #f0f0f0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; box-sizing: border-box;">
            <div style="background-color: #0B6E7F; background-image: linear-gradient(135deg, #0B6E7F 0%, #0ea5e9 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">Welcome to Porteinw!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 15px;">We're excited to have you on board</p>
            </div>
            <div style="padding: 32px 28px;">
                <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 20px;">Hello ${name},</h2>
                <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 24px 0; font-size: 15px;">Thank you for joining us! We're thrilled to have you become a part of our community and can't wait for you to get started.</p>
                
                <p style="color: #8a8a8a; font-size: 13px; line-height: 1.7; margin: 24px 0 0 0;">If you have any questions, feel free to reach out to our support team. We're here to help!</p>
            </div>
            <div style="background: #fafafa; padding: 20px 28px; text-align: center; border-top: 1px solid #f0f0f0;">
                <p style="color: #8a8a8a; margin: 0; font-size: 12px;">© 2026 Porteinw. All rights reserved.</p>
            </div>
        </div>
    `;
    sendMail(email, "Welcome to Porteinw!", html);
};

export const sendAdminCreatedEmail = (email: string, name: string, password: string) => {
    const loginUrl = `${config.client_url}/auth/login`;
    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 24px; background: white; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); box-sizing: border-box;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Hello ${name},</h2>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">You have been added as an Administrator for Porteinw.</p>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">Here are your temporary login credentials:</p>
            <div style="background: #fffaf0; border: 1px solid #ffe8b8; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; color: #4a4a4a; word-break: break-all;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0; color: #4a4a4a; word-break: break-all;"><strong>Password:</strong> ${password}</p>
            </div>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">Please login using the button below and change your password immediately.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" target="_blank" style="background-color: #0B6E7F; background-image: linear-gradient(to right, #0B6E7F, #0ea5e9); color: #ffffff !important; padding: 12px 30px; text-decoration: none !important; border-radius: 24px; display: inline-block; font-weight: 500; font-size: 14px; text-align: center; border: none;">Login to Dashboard</a>
            </div>
        </div>
    `;
    sendMail(email, "Your Admin Account Has Been Created", html);
};

export const sendEmailUpdateVerification = (email: string, name: string, verificationUrl: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 24px; background: white; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); box-sizing: border-box;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Hello ${name},</h2>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">Please verify your new email address by clicking the button below:</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" target="_blank" style="background-color: #0B6E7F; background-image: linear-gradient(to right, #0B6E7F, #0ea5e9); color: #ffffff !important; padding: 12px 30px; text-decoration: none !important; border-radius: 24px; display: inline-block; font-weight: 500; font-size: 14px; text-align: center; border: none;">Verify New Email</a>
            </div>
            <p style="color: #8a8a8a; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
    `;
    sendMail(email, "Verify Your New Email", html);
};

export const sendGroupInvitationEmail = (email: string, groupName: string, code: string) => {
    const registerUrl = `${config.client_url}/auth/member/register?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
    const loginUrl = `${config.client_url}/auth/member/login?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 24px; background: white; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); box-sizing: border-box;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Hello,</h2>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">You have been invited to join the group: <strong style="color: #0B6E7F;">${groupName}</strong>.</p>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">Your invitation code is: <strong style="color: #0B6E7F; font-size: 18px; letter-spacing: 1px;">${code}</strong></p>
            
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">If you do not have an account, click below to register and join:</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${registerUrl}" target="_blank" style="background-color: #0B6E7F; background-image: linear-gradient(to right, #0B6E7F, #0ea5e9); color: #ffffff !important; padding: 12px 30px; text-decoration: none !important; border-radius: 24px; display: inline-block; font-weight: 500; font-size: 14px; text-align: center; border: none;">Join Group & Register</a>
            </div>
            
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">If you already have an account, sign in to join:</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${loginUrl}" target="_blank" style="background-color: #1a1a1a; color: #ffffff !important; padding: 12px 30px; text-decoration: none !important; border-radius: 24px; display: inline-block; font-weight: 500; font-size: 14px; text-align: center; border: none;">Sign In & Join</a>
            </div>

            <p style="color: #8a8a8a; font-size: 12px; line-height: 1.6; word-break: break-all;">Registration link: <span style="word-break: break-all;">${registerUrl}</span></p>
        </div>
    `;
    sendMail(email, `You've Been Invited to Join ${groupName}`, html);
};

export const sendOrderConfirmationEmail = (email: string, customerName: string, orderDetails: any) => {
    const { items, totalPrice, address, status, _id, orderId } = orderDetails;
    const orderIdDisplay = _id || orderId;

    const itemsHtml = items
        .map(
            (item: any) => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 8px; color: #1a1a1a; vertical-align: top;">
                <div style="font-weight: 500; font-size: 14px; color: #1a1a1a;">${item.productName}</div>
                <div style="font-size: 12px; color: #8a8a8a; margin-top: 4px;">${item.quantity} × ${item.singlePrice.toFixed(2)} SEK</div>
            </td>
            <td style="padding: 12px 8px; text-align: right; color: #1a1a1a; font-weight: 600; font-size: 14px; vertical-align: top; white-space: nowrap;">
                ${item.lineTotal.toFixed(2)} SEK
            </td>
        </tr>
    `,
        )
        .join("");

    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 580px; margin: 0 auto; padding: 0; background: white; border: 1px solid #f0f0f0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; box-sizing: border-box;">
            <div style="background-color: #0B6E7F; background-image: linear-gradient(135deg, #0B6E7F 0%, #0ea5e9 100%); padding: 28px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Order Confirmed!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Thank you for your order</p>
                ${orderIdDisplay ? `<p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 13px; font-family: monospace;">Order ID: ${orderIdDisplay}</p>` : ""}
            </div>
            
            <div style="padding: 24px 20px;">
                <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px;">Hello ${customerName},</h2>
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 24px 0; font-size: 14px;">
                    We've received your order! Your order status is: <strong style="color: #0B6E7F;">${status}</strong>.
                </p>
                
                <div style="background: #fffaf0; border: 1px solid #ffe8b8; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                    <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 16px;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #ffe8b8;">
                                <th style="padding: 8px; text-align: left; font-size: 12px; color: #0B6E7F; text-transform: uppercase;">Item &amp; Qty</th>
                                <th style="padding: 8px; text-align: right; font-size: 12px; color: #0B6E7F; text-transform: uppercase;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style="padding: 12px 8px 4px 8px; text-align: right; font-weight: bold; color: #1a1a1a; font-size: 14px;">Order Total:</td>
                                <td style="padding: 12px 8px 4px 8px; text-align: right; font-weight: bold; color: #0B6E7F; font-size: 16px; white-space: nowrap;">${totalPrice.toFixed(2)} SEK</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="background: #f9f9f9; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                    <h3 style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 15px;">Shipping Address</h3>
                    <p style="color: #4a4a4a; margin: 0; line-height: 1.6; font-size: 14px;">
                        ${address.street}<br>
                        ${address.city}, ${address.postalCode}<br>
                        ${address.locality}
                    </p>
                </div>
                
                <p style="color: #8a8a8a; font-size: 12px; line-height: 1.6; margin: 0;">
                    If you have any questions about your order, feel free to reach out to our support team.
                </p>
            </div>
            
            <div style="background: #fafafa; padding: 16px 20px; text-align: center; border-top: 1px solid #f0f0f0;">
                ${orderIdDisplay ? `<p style="color: #8a8a8a; margin: 0 0 6px 0; font-size: 12px;">Order ID: <strong style="color: #4a4a4a;">${orderIdDisplay}</strong></p>` : ""}
                <p style="color: #8a8a8a; margin: 0; font-size: 12px;">© 2026 Porteinw. All rights reserved.</p>
            </div>
        </div>
    `;

    sendMail(email, "Your Order Confirmation - Porteinw", html);
};

export const sendPasswordChangedEmail = (email: string, name?: string, newPassword?: string) => {
    const loginUrl = `${config.client_url}/auth/login`;
    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 500px; margin: 0 auto; padding: 24px; background: white; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); box-sizing: border-box;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">${name ? `Hello ${name},` : "Hello,"}</h2>
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">Your password for Porteinw has been updated by an administrator.</p>
            ${
                newPassword
                    ? `<div style="background: #fffaf0; border: 1px solid #ffe8b8; padding: 16px; margin: 20px 0; border-radius: 8px;">
                        <p style="margin: 0; color: #4a4a4a; word-break: break-all;"><strong>New Password:</strong> ${newPassword}</p>
                       </div>`
                    : ""
            }
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">You can now log in using your updated password.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" target="_blank" style="background-color: #0B6E7F; background-image: linear-gradient(to right, #0B6E7F, #0ea5e9); color: #ffffff !important; padding: 12px 30px; text-decoration: none !important; border-radius: 24px; display: inline-block; font-weight: 500; font-size: 14px; text-align: center; border: none;">Login to Dashboard</a>
            </div>
            <p style="color: #8a8a8a; font-size: 12px; margin-top: 24px;">If you did not request or expect this change, please contact support immediately.</p>
        </div>
    `;
    sendMail(email, "Your Password Has Been Updated - Porteinw", html);
};

export const sendCustomerServiceConfirmationEmail = (
    email: string,
    name: string,
    requestDetails: {
        _id?: string;
        issueType: string;
        orderId?: string;
        description: string;
    },
) => {
    const { _id, issueType, orderId, description } = requestDetails;
    const issueTypeName = issueType === "reklamation" ? "Reklamation (Complaint)" : "Byte (Exchange)";

    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 580px; margin: 0 auto; padding: 0; background: white; border: 1px solid #f0f0f0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; box-sizing: border-box; word-break: break-word; overflow-wrap: break-word;">
            <div style="background-color: #0B6E7F; background-image: linear-gradient(135deg, #0B6E7F 0%, #0ea5e9 100%); padding: 24px 16px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px; font-weight: bold;">Customer Service Request Received</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px;">We've received your request</p>
                ${_id ? `<p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 12px; font-family: monospace; word-break: break-all;">Request ID: ${_id}</p>` : ""}
            </div>
            
            <div style="padding: 20px 16px;">
                <h2 style="color: #1a1a1a; margin: 0 0 14px 0; font-size: 17px;">Hello ${name},</h2>
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0; font-size: 14px;">
                    Thank you for contacting Porteinw Customer Support. We have successfully received your request and our team will process it shortly.
                </p>
                
                <div style="background: #fffaf0; border: 1px solid #ffe8b8; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                    <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 15px;">Request Details</h3>
                    <div style="font-size: 14px; color: #4a4a4a; line-height: 1.6;">
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #1a1a1a;">Issue Type:</strong>
                            <span style="color: #0B6E7F; font-weight: 600; margin-left: 4px;">${issueTypeName}</span>
                        </div>
                        ${
                            orderId
                                ? `<div style="margin-bottom: 8px; word-break: break-all;">
                            <strong style="color: #1a1a1a;">Order ID:</strong>
                            <span style="color: #4a4a4a; margin-left: 4px;">${orderId}</span>
                        </div>`
                                : ""
                        }
                        <div>
                            <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">Description:</strong>
                            <div style="color: #4a4a4a; white-space: pre-wrap; word-break: break-word; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #f0e0c0;">${description}</div>
                        </div>
                    </div>
                </div>
                
                <p style="color: #8a8a8a; font-size: 12px; line-height: 1.6; margin: 0;">
                    Our support team will get back to you as soon as possible. If you need to follow up, please reply to this email.
                </p>
            </div>
            
            <div style="background: #fafafa; padding: 14px 16px; text-align: center; border-top: 1px solid #f0f0f0;">
                <p style="color: #8a8a8a; margin: 0; font-size: 12px;">© 2026 Porteinw. All rights reserved.</p>
            </div>
        </div>
    `;

    sendMail(email, "Customer Service Request Received - Porteinw", html);
};

export const sendCustomerServiceReplyEmail = (
    email: string,
    name: string,
    details: {
        _id: string;
        issueType: string;
        orderId?: string;
        status: string;
        adminNotes: string;
    },
) => {
    const { _id, issueType, orderId, status, adminNotes } = details;
    const issueTypeName = issueType === "reklamation" ? "Reklamation (Complaint)" : "Byte (Exchange)";
    const statusFormatted = status.replace("_", " ").toUpperCase();

    const html = `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 580px; margin: 0 auto; padding: 0; background: white; border: 1px solid #f0f0f0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; box-sizing: border-box; word-break: break-word; overflow-wrap: break-word;">
            <div style="background-color: #0B6E7F; background-image: linear-gradient(135deg, #0B6E7F 0%, #0ea5e9 100%); padding: 24px 16px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px; font-weight: bold;">Update on Your Support Request</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px;">Porteinw Customer Support Response</p>
                <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 12px; font-family: monospace; word-break: break-all;">Request ID: ${_id}</p>
            </div>
            
            <div style="padding: 20px 16px;">
                <h2 style="color: #1a1a1a; margin: 0 0 14px 0; font-size: 17px;">Hello ${name},</h2>
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 18px 0; font-size: 14px;">
                    Our support team has updated your request. Your current request status is: <strong style="color: #0B6E7F;">${statusFormatted}</strong>.
                </p>
                
                <div style="background: #fffaf0; border: 1px solid #ffe8b8; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                    <h3 style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 15px;">Admin Reply / Message:</h3>
                    <p style="color: #1a1a1a; margin: 0; line-height: 1.6; font-size: 14px; white-space: pre-wrap; word-break: break-word;">${adminNotes}</p>
                </div>
                
                <div style="background: #f9f9f9; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; font-size: 13px; color: #666; word-break: break-all;">
                    <p style="margin: 0 0 4px 0;"><strong>Issue Type:</strong> ${issueTypeName}</p>
                    ${orderId ? `<p style="margin: 0;"><strong>Order ID:</strong> ${orderId}</p>` : ""}
                </div>

                <p style="color: #8a8a8a; font-size: 12px; line-height: 1.6; margin: 0;">
                    If you have further questions or need additional assistance, feel free to reply directly to this email.
                </p>
            </div>
            
            <div style="background: #fafafa; padding: 14px 16px; text-align: center; border-top: 1px solid #f0f0f0;">
                <p style="color: #8a8a8a; margin: 0; font-size: 12px;">© 2026 Porteinw. All rights reserved.</p>
            </div>
        </div>
    `;

    sendMail(email, `Update on Support Request #${_id} - Porteinw`, html);
};

