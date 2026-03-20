import { AuthError } from "@packages/error-handler";
import { NextFunction, Response } from "express";

export const isSeller = (req: any, res: Response, next: NextFunction) => {
  if (req.role !== "seller") {
    return next(new AuthError("Access denied: Seller only"));
  }
  next();
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.role !== "admin") {
    return next(new AuthError("Access denied: Admin only"));
  }
  next();
};

export const isUser = (req: any, res: Response, next: NextFunction) => {
  if (req.role !== "user") {
    return next(new AuthError("Access denied: Seller only"));
  }
  next();
};

export const isSellerOrAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.role !== "seller" && req.role !== "admin") {
    return next(new AuthError("Access denied: Seller or Admin only"));
  }
  next();
};