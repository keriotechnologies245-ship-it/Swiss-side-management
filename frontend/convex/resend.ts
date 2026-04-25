import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { api } from "./_generated/api";

export const sendOtpEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) throw new Error("RESEND_API_KEY is missing.");
    const resend = new Resend(resendApiKey);

    const userInfo = await ctx.runQuery(api.users.getOtpForEmail, { email: args.email });
    if (!userInfo || !userInfo.otpCode) throw new Error("No active OTP found.");

    const { error } = await resend.emails.send({
      from: `Swiss Side Security <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
      to: [args.email],
      subject: `Access Code: ${userInfo.otpCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1e293b; text-transform: uppercase; font-size: 16px; letter-spacing: 1px;">Access Verification</h2>
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${userInfo.otpCode}</span>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error("RESEND OTP ERROR:", error);
      throw new Error(`Email failed: ${error.message}`);
    }

    return { success: true };
  },
});

/**
 * Action: DISPATCH SECURE RESET LINK (Cache Buster Version)
 */
export const dispatchSecureResetLink = action({
  args: { email: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) throw new Error("RESEND_API_KEY is missing from Convex Dashboard.");
    
    const resend = new Resend(resendApiKey);

    const { error } = await resend.emails.send({
      from: `Swiss Side Security <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
      to: [args.email],
      subject: "Action Required: Reset Your Swiss Side Password",
      html: `
        <div style="font-family: sans-serif; max-width: 450px; margin: 0 auto; padding: 30px; border: 1px solid #f1f5f9; border-radius: 12px; background: white;">
          <h2 style="color: #0f172a; text-transform: uppercase; font-size: 18px; letter-spacing: 1.5px; border-bottom: 2px solid #ef4444; padding-bottom: 10px; display: inline-block;">Security Alert</h2>
          <p style="color: #475569; font-size: 15px; margin-top: 20px;">Use this token to reset your master password. It expires in 30 minutes.</p>
          <div style="background: #fff1f2; padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0; border: 1px solid #fecdd3;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #e11d48; font-family: monospace;">${args.token}</span>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("CRITICAL RESEND ERROR:", error);
      throw new Error(`Email System Error: ${error.message}`);
    }

    return { success: true };
  },
});
