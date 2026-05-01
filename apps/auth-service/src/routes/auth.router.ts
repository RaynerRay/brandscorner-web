import express, { Router } from "express";
import {
  addUserAddress,
  createShop,
  // createStripeConnectLink,
  deleteUserAddress,
  getAdmin,
  getLayoutData,
  getSeller,
  getUser,
  getUserAddresses,
  loginAdmin,
  loginSeller,
  loginUser,
  logOutAdmin,
  logOutSeller,
  logOutUser,
  refreshToken,
  registerSeller,
  resetUserPassword,
  updateUserPassword,
  userForgotPassword,
  userRegistration,
  verifySeller,
  verifyUser,
  verifyUserForgotPassword,
} from "../controller/auth.controller";
import { googleCallback } from "../controller/google.auth.controller";
import passport from "../utils/google.auth.strategy";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isAdmin, isSeller } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["openid", "email", "profile"], session: false })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err: any, user: any) => {
      if (err || !user) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.get("/logout-user", isAuthenticated, logOutUser);
router.post("/refresh-token", refreshToken);
router.get("/logged-in-user", isAuthenticated, getUser);
router.post("/forgot-password-user", userForgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
// router.post("/create-stripe-link", createStripeConnectLink);
router.post("/login-seller", loginSeller);
router.get("/logout-seller", isAuthenticated, isSeller, logOutSeller);
router.post("/login-admin", loginAdmin);
router.get("/logout-admin", isAuthenticated, logOutAdmin);
router.get("/logged-in-seller", isAuthenticated, isSeller, getSeller);
router.get("/logged-in-admin", isAuthenticated, isAdmin, getAdmin);
router.post("/change-password", isAuthenticated, updateUserPassword);
router.get("/shipping-addresses", isAuthenticated, getUserAddresses);
router.post("/add-address", isAuthenticated, addUserAddress);
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);
router.get("/get-layouts", getLayoutData);

export default router;
