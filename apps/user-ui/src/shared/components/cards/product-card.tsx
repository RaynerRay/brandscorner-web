import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import Ratings from "../ratings";
import { Eye, Heart, ShoppingBag, CheckCircle, Clock } from "lucide-react";
import ProductDetailsCard from "./product-details.card";
import { useStore } from "apps/user-ui/src/store";
import useUser from "apps/user-ui/src/hooks/useUser";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGVjb21tZXJjZXxlbnwwfHwwfHx8MA%3D%3D";

const ProductCard = ({
  product,
  isEvent,
}: {
  product: any;
  isEvent?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(
    product?.images?.[0]?.url || FALLBACK_IMAGE
  );
  const [cartNotification, setCartNotification] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some((item: any) => item.id === product.id);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === product.id);

  const discount = product?.regular_price && product?.sale_price
    ? Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)
    : null;

  useEffect(() => {
    if (isEvent && product?.ending_date) {
      const update = () => {
        const diff = new Date(product.ending_date).getTime() - Date.now();
        if (diff <= 0) { setTimeLeft("Expired"); return; }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      };
      update();
      const interval = setInterval(update, 60000);
      return () => clearInterval(interval);
    }
  }, [isEvent, product?.ending_date]);

  const handleAddToCart = useCallback(() => {
    if (isInCart) return;
    addToCart({ ...product, quantity: 1 }, user, location, deviceInfo);
    setCartNotification(true);
    setTimeout(() => setCartNotification(false), 2500);
  }, [isInCart, product, user, location, deviceInfo, addToCart]);

  return (
    <>
      <div
        className="group w-full bg-white rounded-2xl overflow-hidden relative flex flex-col transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 border border-slate-100"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Cart notification toast */}
        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-slate-900 text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-xl whitespace-nowrap transition-all duration-300 ${
            cartNotification
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-3 pointer-events-none"
          }`}
          aria-live="polite"
        >
          <CheckCircle size={13} className="text-emerald-400 shrink-0" />
          Added to cart!
        </div>

        {/* Image container */}
        <div className="relative w-full h-[250px] overflow-hidden bg-slate-50">
          <Link href={`/product/${product?.slug}`}>
            <img
              src={imgSrc}
              alt={product?.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgSrc(FALLBACK_IMAGE)}
            />
          </Link>

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isEvent && (
              <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-wide uppercase">
                Sale
              </span>
            )}
            {discount && discount > 0 && (
              <span className="inline-flex bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                -{discount}%
              </span>
            )}
            {product?.stock <= 5 && product?.stock > 0 && (
              <span className="inline-flex bg-amber-400 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                Only {product.stock} left
              </span>
            )}
          </div>

          {/* Action buttons — slide in from right */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {[
              {
                icon: (
                  <Heart
                    size={16}
                    fill={isWishlisted ? "currentColor" : "none"}
                    className={isWishlisted ? "text-red-500" : "text-slate-600"}
                  />
                ),
                onClick: () =>
                  isWishlisted
                    ? removeFromWishlist(product.id, user, location, deviceInfo)
                    : addToWishlist({ ...product, quantity: 1 }, user, location, deviceInfo),
                title: isWishlisted ? "Remove from wishlist" : "Add to wishlist",
                delay: "delay-[0ms]",
                active: isWishlisted,
              },
              {
                icon: <Eye size={16} className="text-slate-600" />,
                onClick: () => setOpen(true),
                title: "Quick view",
                delay: "delay-[50ms]",
              },
              {
                icon: (
                  <ShoppingBag
                    size={16}
                    className={isInCart ? "text-emerald-500" : "text-slate-600"}
                  />
                ),
                onClick: handleAddToCart,
                title: isInCart ? "In cart" : "Add to cart",
                delay: "delay-[100ms]",
                active: isInCart,
              },
            ].map((btn, i) => (
              <button
                key={i}
                title={btn.title}
                onClick={btn.onClick}
                className={`w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 ${btn.delay} ${
                  hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                }`}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Content — compact strip */}
        <div className="px-3 pt-2.5 pb-3">
          {/* Title + shop */}
          <Link href={`/product/${product?.slug}`}>
            <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 leading-snug hover:text-slate-600 transition-colors">
              {product?.title}
            </h3>
          </Link>
          <Link
            href={`/shop/${product?.Shop?.id}`}
            className="text-[11px] text-slate-400 hover:text-blue-500 transition-colors"
          >
            {product?.Shop?.name}
          </Link>

          {/* Price + ratings row */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900">
                ${product?.sale_price}
              </span>
              {product?.regular_price > product?.sale_price && (
                <span className="text-xs line-through text-slate-400">
                  ${product?.regular_price}
                </span>
              )}
            </div>
            <Ratings rating={product?.ratings} />
          </div>

          {/* Event countdown */}
          {isEvent && timeLeft && timeLeft !== "Expired" && (
            <div className="mt-2 flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1.5">
              <Clock size={11} className="text-orange-500 shrink-0" />
              <span className="text-[11px] text-orange-600 font-semibold">
                {timeLeft} left
              </span>
            </div>
          )}

          {/* Add to cart CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isInCart || product?.stock === 0}
            className={`mt-2.5 w-full py-2 rounded-lg text-xs font-semibold transition-all duration-300 active:scale-95 ${
              isInCart
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                : product?.stock === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-700"
            } ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
          >
            {isInCart ? (
              <span className="flex items-center justify-center gap-1">
                <CheckCircle size={12} /> In Cart
              </span>
            ) : product?.stock === 0 ? "Out of Stock" : (
              <span className="flex items-center justify-center gap-1">
                <ShoppingBag size={12} /> Add to Cart
              </span>
            )}
          </button>
        </div>
      </div>

      {open && <ProductDetailsCard data={product} setOpen={setOpen} />}
    </>
  );
};

export default ProductCard;