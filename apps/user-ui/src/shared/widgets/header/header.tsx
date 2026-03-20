"use client";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { Search, X, ShoppingBag, Heart, User, ChevronRight, Tag } from "lucide-react";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import HeaderBottom from "./header-bottom";
import useUser from "apps/user-ui/src/hooks/useUser";
import Image from "next/image";
import { useStore } from "apps/user-ui/src/store";
import useLayout from "apps/user-ui/src/hooks/useLayout";

const Header = () => {
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const { layout } = useLayout();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearchClick = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSuggestions(true);
    try {
      const res = await axiosInstance.get(
        `/product/api/search-products?q=${encodeURIComponent(searchQuery)}`
      );
      setSuggestions(res.data.products.slice(0, 10));
    } catch (err) {
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearchClick();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showDropdown = (suggestions.length > 0 || loadingSuggestions) && searchFocused;

  return (
    <header className="w-full bg-white border-b border-slate-100">
      {/* Announcement bar */}
      <div className="w-full bg-slate-900 text-white text-xs tracking-[0.2em] font-light text-center py-2.5">
        FREE SHIPPING ON ORDERS OVER $75 &nbsp;·&nbsp; USE CODE{" "}
        <span className="font-semibold text-amber-300">WELCOME20</span> FOR 20% OFF
      </div>

      {/* Main header */}
      <div className="w-[86%] max-w-[1400px] mx-auto hidden md:flex items-center justify-between py-6 gap-8">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 group">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  background: "#FFD600",
                  borderRadius: "8px",
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Tag size={20} color="#0a0a0a" strokeWidth={2.5} />
              </div>
              <div>
                <div
                  style={{
                    color: "#0a0a0a",
                    fontWeight: 800,
                    fontSize: "17px",
                    letterSpacing: "-0.3px",
                    lineHeight: 1.1,
                  }}
                >
                  BRANDS
                </div>
                <div
                  style={{
                    color: "#FFD600",
                    fontWeight: 800,
                    fontSize: "17px",
                    letterSpacing: "-0.3px",
                    lineHeight: 1.1,
                  }}
                >
                  FOR LESS
                </div>
              </div>
            </div>
        </Link>

        {/* Search bar */}
        <div
          ref={searchRef}
          className={`flex-1 max-w-2xl relative transition-all duration-300 ${
            searchFocused ? "max-w-3xl" : ""
          }`}
        >
          <div
            className={`flex items-center bg-slate-50 border-2 transition-all duration-300 rounded-full overflow-hidden ${
              searchFocused
                ? "border-slate-800 bg-white shadow-lg shadow-slate-900/8"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="pl-5 pr-2 text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search for products, brands..."
              className="flex-1 py-3.5 pr-2 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 font-[450]"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={handleSearchClick}
              className="m-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium rounded-full transition-all duration-200 hover:shadow-md active:scale-95 whitespace-nowrap"
            >
              Search
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showDropdown && (
            <div className="absolute w-full top-[calc(100%+8px)] bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-900/12 z-50 overflow-hidden">
              {loadingSuggestions ? (
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-400">Searching...</span>
                </div>
              ) : (
                <div className="py-2">
                  <p className="px-4 pt-1 pb-2 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                    Suggestions
                  </p>
                  {suggestions.map((item, idx) => (
                    <Link
                      href={`/product/${item.slug}`}
                      key={item.id}
                      onClick={() => {
                        setSuggestions([]);
                        setSearchQuery("");
                        setSearchFocused(false);
                      }}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-200">
                          <Search size={12} />
                        </div>
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">
                          {item.title}
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: profile + actions */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Profile */}
          <div className="flex items-center gap-3">
            {!isLoading && user ? (
              <Link href="/profile" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-slate-900 ring-offset-2 transition-all duration-200 group-hover:ring-offset-4">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-slate-400 tracking-wide">Hello,</p>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-600 transition-colors">
                    {user?.name?.split(" ")[0]}
                  </p>
                </div>
              </Link>
            ) : (
              <Link href="/login" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 group-hover:border-slate-900 group-hover:text-slate-900 group-hover:bg-slate-50 transition-all duration-200">
                  <User size={18} />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-slate-400 tracking-wide">Hello,</p>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-600 transition-colors">
                    {isLoading ? "···" : "Sign In"}
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-200" />

          {/* Wishlist */}
          <Link href="/wishlist" className="relative group">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200 group-hover:scale-110">
              <Heart size={22} className="transition-all duration-200" />
            </div>
            {(wishlist?.length ?? 0) > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-[10px] text-white font-bold leading-none">
                  {wishlist?.length > 9 ? "9+" : wishlist?.length}
                </span>
              </div>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative group">
            <div className="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-700 text-white transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/25 active:scale-95">
              <div className="relative">
                <ShoppingBag size={18} />
                {(cart?.length ?? 0) > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border border-slate-900">
                    <span className="text-[9px] text-slate-900 font-bold leading-none">
                      {cart?.length > 9 ? "9+" : cart?.length}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold">Cart</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile header (sm and below) */}
      <div className="md:hidden flex items-center justify-between px-4 py-4">
        <Link href="/">
          <Image
            src={
              layout?.logo ||
              "https://ik.imagekit.io/sjbr5usgh/logo/Blue%20Waves%20Surfing%20Club%20Logo.png?updatedAt=1744371251216"
            }
            width={100}
            height={36}
            alt="Logo"
            className="h-9 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="p-2 text-slate-600 hover:text-slate-900">
            <User size={22} />
          </Link>
          <Link href="/wishlist" className="relative p-2 text-slate-600 hover:text-red-500">
            <Heart size={22} />
            {(wishlist?.length ?? 0) > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {wishlist?.length}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative p-2 text-slate-600 hover:text-slate-900">
            <ShoppingBag size={22} />
            {(cart?.length ?? 0) > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-amber-400 text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">
                {cart?.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-4">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full overflow-hidden">
          <div className="pl-4 text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products..."
            className="flex-1 px-3 py-3 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
          />
          <button
            onClick={handleSearchClick}
            className="m-1 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full"
          >
            Go
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100" />
      <HeaderBottom />
    </header>
  );
};

export default Header;