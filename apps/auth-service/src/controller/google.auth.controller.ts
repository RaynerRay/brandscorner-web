import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import { sendLog } from "@packages/utils/logs/send-logs";
import prisma from "@packages/libs/prisma";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;

    sendLog({
      type: "success",
      message: `Google login successful: ${user.email}`,
      source: "auth-service",
    });

    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");

    const role = user.role === "admin" ? "admin" : "user";

    const accessToken = jwt.sign(
      { id: user.id, role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    );

    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);

    res.redirect(`${FRONTEND_URL}/?google_login=success`);
  } catch (error) {
    next(error);
  }
};

interface GoogleTokenInfo {
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  name: string;
  picture: string;
}

/**
 * POST /auth/api/google-mobile-login
 * Body: { idToken: string }
 *
 * Verifies the Google ID token obtained by the native mobile SDK,
 * finds or creates the user, then returns JWT tokens in the response body
 * (cookies are not usable in React Native).
 */
export const googleMobileLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    // Verify the ID token via Google's tokeninfo endpoint.
    // Google validates the signature and expiry server-side.
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!tokenInfoRes.ok) {
      return res.status(401).json({ message: "Invalid Google ID token" });
    }

    const tokenInfo = (await tokenInfoRes.json()) as GoogleTokenInfo;

    // Ensure the token was issued for this app's client ID
    const validAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
    ].filter(Boolean);

    if (!validAudiences.includes(tokenInfo.aud)) {
      return res.status(401).json({ message: "Google token audience mismatch" });
    }

    if (tokenInfo.email_verified !== "true") {
      return res.status(401).json({ message: "Google email is not verified" });
    }

    const { email, name } = tokenInfo;

    let user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      const userCount = await prisma.users.count();
      user = await prisma.users.create({
        data: {
          name,
          email,
          ...(userCount === 0 && { role: "admin" }),
        },
      });

      sendLog({
        type: "success",
        message: `New user registered via Google (mobile): ${email}`,
        source: "auth-service",
      });
    } else {
      sendLog({
        type: "success",
        message: `Google mobile login successful: ${email}`,
        source: "auth-service",
      });
    }

    const role = user.role === "admin" ? "admin" : "user";

    const accessToken = jwt.sign(
      { id: user.id, role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Google login successful!",
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};
