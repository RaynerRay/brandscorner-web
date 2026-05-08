import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isSeller } from "@packages/middleware/authorizeRoles";
import express, { type Router } from "express";
import {
  deleteShop,
  editSellerProfile,
  followShop,
  getSellerEvents,
  getSellerInfo,
  getSellerProducts,
  getUserFollowingCount,
  isFollowing,
  markNotificationAsRead,
  restoreShop,
  sellerNotifications,
  unfollowShop,
  updateProfilePictures,
  uploadImage,
} from "../controllers/seller.controller";

const router: Router = express.Router();

router.delete("/delete", isAuthenticated, isSeller, deleteShop);
router.patch("/restore", isAuthenticated, isSeller, restoreShop);
router.post("/upload-image", isAuthenticated, isSeller, uploadImage);
router.put("/update-image", isAuthenticated, isSeller, updateProfilePictures);
router.put("/edit-profile", isAuthenticated, isSeller, editSellerProfile);
router.get("/get-seller/:id", getSellerInfo);
router.get("/get-seller-products/:id", getSellerProducts);
router.get("/get-seller-events/:id", getSellerEvents);
router.get(
  "/seller-notifications",
  isAuthenticated,
  isSeller,
  sellerNotifications
);
router.post("/follow-shop", isAuthenticated, isSeller, followShop);
router.post("/unfollow-shop", isAuthenticated, isSeller, unfollowShop);
router.get("/is-following/:id", isAuthenticated, isSeller, isFollowing);
router.post(
  "/mark-notification-as-read",
  isAuthenticated,
  isSeller,
  markNotificationAsRead
);

router.get("/user-following-count", isAuthenticated, getUserFollowingCount);

export default router;
