import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import pool from "../config/database.js";

/* ================= GOOGLE CONFIG ================= */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ================= MICROSOFT TOKEN VERIFY ================= */
const verifyMicrosoftToken = async (accessToken) => {
  const response = await axios.get(
    "https://graph.microsoft.com/v1.0/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};

/* ================= MICROSOFT LOGIN ================= */
export const microsoftLogin = async (req, res) => {
  try {
    const { token } = req.body; // ACCESS TOKEN (Graph)

    const msUser = await verifyMicrosoftToken(token);

    const email = msUser.mail || msUser.userPrincipalName;
    const name = msUser.displayName;

    if (!email) {
      return res.status(400).json({ message: "Email not found in Microsoft account" });
    }

    const [[user]] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // ❌ Block non-admin-added users
    if (!user) {
      return res.status(403).json({
        error: "USER_NOT_REGISTERED",
        message: "Please contact admin to add your email",
      });
    }

    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        provider: "microsoft",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token: jwtToken });

  } catch (err) {
    console.error("Microsoft login error:", err.response?.data || err.message);
    res.status(401).json({ message: "Microsoft login failed" });
  }
};

/* ================= GOOGLE LOGIN ================= */
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name } = ticket.getPayload();

    const [[user]] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      return res.status(403).json({
        message: "Access denied. Contact admin.",
      });
    }

    /* ========== 2FA ENABLED ========= */
    if (user.two_factor_enabled) {
      return res.json({
        requireOTP: true,
        userId: user.id,
      });
    }

    /* ========== 2FA SETUP ========= */
    let base32 = user.two_factor_secret;
    let otpauth_url;

    if (!base32) {
      const secret = speakeasy.generateSecret({
        name: `HR Portal (${email})`,
      });

      base32 = secret.base32;
      otpauth_url = secret.otpauth_url;

      await pool.query(
        "UPDATE users SET two_factor_secret = ? WHERE id = ?",
        [base32, user.id]
      );
    } else {
      otpauth_url = speakeasy.otpauthURL({
        secret: base32,
        label: `HR Portal (${email})`,
        issuer: "HR Portal",
        encoding: "base32",
      });
    }

    res.json({
      setup2FA: true,
      qrCode: otpauth_url,
      manualKey: base32,
      userId: user.id,
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Login failed" });
  }
};

/* ================= VERIFY OTP ================= */
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const [[user]] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: String(otp),
      window: 3,
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await pool.query(
      "UPDATE users SET two_factor_enabled = 1 WHERE id = ?",
      [userId]
    );

    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token: jwtToken });

  } catch (err) {
    console.error("OTP error:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};
export const getMyProfile = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

