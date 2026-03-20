import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sendKafkaEvent } from "../actions/track-user";

type CartProduct = {
  id: string;
  title: string;
  sale_price: number;
  images: { url: string }[];
  quantity: number;
  shopId: string;
  discount_codes?: string[];
  selectedOptions?: {
    color?: string;
    size?: string;
  };
};

type WishlistProduct = {
  id: string;
  title: string;
  sale_price: number;
  images: { url: string }[];
  shopId: string;
};

type Store = {
  cart: CartProduct[];
  wishlist: WishlistProduct[];

  addToCart: (product: CartProduct, user: any, location: any, deviceInfo: any) => void;
  removeFromCart: (id: string, user: any, location: any, deviceInfo: any) => void;
  clearCart: (user: any, location: any, deviceInfo: any) => void;

  addToWishlist: (product: WishlistProduct, user: any, location: any, deviceInfo: any) => void;
  removeFromWishlist: (id: string, user: any, location: any, deviceInfo: any) => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],

      // ── Add to Cart ──────────────────────────────────────────────────────
      addToCart: (product, user, location, deviceInfo) => {
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: (item.quantity ?? 1) + 1 }
                  : item
              ),
            };
          }
          return {
            cart: [...state.cart, { ...product, quantity: product.quantity ?? 1 }],
          };
        });

        if (user?.id && location && deviceInfo) {
          sendKafkaEvent({
            userId: user.id,
            productId: product.id,
            shopId: product.shopId,
            action: "add_to_cart",
            country: location.country || "Unknown",
            city: location.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },

      // ── Remove from Cart ─────────────────────────────────────────────────
      removeFromCart: (id, user, location, deviceInfo) => {
        const removed = get().cart.find((item) => item.id === id);

        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        }));

        if (user?.id && location && deviceInfo && removed) {
          sendKafkaEvent({
            userId: user.id,
            productId: removed.id,
            shopId: removed.shopId,
            action: "remove_from_cart",
            country: location.country || "Unknown",
            city: location.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },

      // ── Clear Cart (called after order is placed) ────────────────────────
      clearCart: (user, location, deviceInfo) => {
        const cartItems = get().cart;
        set({ cart: [] });

        if (user?.id && location && deviceInfo) {
          cartItems.forEach((item) => {
            sendKafkaEvent({
              userId: user.id,
              productId: item.id,
              shopId: item.shopId,
              action: "remove_from_cart",
              country: location.country || "Unknown",
              city: location.city || "Unknown",
              device: deviceInfo || "Unknown Device",
            });
          });
        }
      },

      // ── Add to Wishlist ──────────────────────────────────────────────────
      addToWishlist: (product, user, location, deviceInfo) => {
        set((state) => {
          if (state.wishlist.find((item) => item.id === product.id)) return state;
          return { wishlist: [...state.wishlist, product] };
        });

        if (user?.id && location && deviceInfo) {
          sendKafkaEvent({
            userId: user.id,
            productId: product.id,
            shopId: product.shopId,
            action: "add_to_wishlist",
            country: location.country || "Unknown",
            city: location.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },

      // ── Remove from Wishlist ─────────────────────────────────────────────
      removeFromWishlist: (id, user, location, deviceInfo) => {
        const removed = get().wishlist.find((item) => item.id === id);

        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== id),
        }));

        if (user?.id && location && deviceInfo && removed) {
          sendKafkaEvent({
            userId: user.id,
            productId: removed.id,
            shopId: removed.shopId,
            action: "remove_from_wishlist",
            country: location.country || "Unknown",
            city: location.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },
    }),
    { name: "store-storage" }
  )
);