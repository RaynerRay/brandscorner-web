import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import { sendLog } from "@packages/utils/logs/send-logs";

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
