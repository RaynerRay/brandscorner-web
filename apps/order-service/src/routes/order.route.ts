import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import {
  confirmOrder,
  createOrder,
  getAdminOrders,
  getOrderDetails,
  getSellerOrders,
  getUserOrders,
  updateDeliveryStatus,
  verifyCouponCode,
} from "../controllers/order.controller";
import { isAdmin, isSeller, isSellerOrAdmin } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.post("/create-order", isAuthenticated, createOrder);
router.patch("/confirm-order/:orderId", isAuthenticated, isSellerOrAdmin, confirmOrder);
router.get("/get-seller-orders", isAuthenticated, isSeller, getSellerOrders);
router.get("/get-order-details/:id", isAuthenticated, getOrderDetails);
router.put("/update-status/:orderId", isAuthenticated, isSeller, updateDeliveryStatus);
router.put("/verify-coupon", isAuthenticated, verifyCouponCode);
router.get("/get-user-orders", isAuthenticated, getUserOrders);
router.get("/get-admin-orders", isAuthenticated, isAdmin, getAdminOrders);

export default router;