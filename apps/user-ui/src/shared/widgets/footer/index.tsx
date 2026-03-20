"use client";

import React from "react";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ArrowUp,
  Tag,
} from "lucide-react";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  if (pathname === "/inbox") return null;

  return (
    <footer
      style={{
        background: "#0a0a0a",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative yellow accent bar */}
      <div
        style={{
          height: "4px",
          background: "linear-gradient(90deg, #FFD600 0%, #FFE566 50%, #FFD600 100%)",
        }}
      />

      {/* Diagonal yellow geometric background accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "320px",
          height: "320px",
          background: "rgba(255,214,0,0.04)",
          borderRadius: "50%",
          transform: "translate(40%, -40%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "200px",
          height: "200px",
          background: "rgba(255,214,0,0.03)",
          borderRadius: "50%",
          transform: "translate(-40%, 40%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "60px 40px 0",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "48px",
          }}
        >
          {/* Brand Column */}
          <div>
            {/* Logo */}
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
                    color: "#ffffff",
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

            <p
              style={{
                color: "#888",
                fontSize: "13.5px",
                lineHeight: 1.7,
                maxWidth: "220px",
                marginBottom: "24px",
              }}
            >
              Premium brands at unbeatable prices. Your destination for quality
              fashion and lifestyle products in Zimbabwe.
            </p>

            {/* Social Icons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { icon: <Facebook size={16} />, href: "#" },
                { icon: <Twitter size={16} />, href: "#" },
                {
                  icon: <Linkedin size={16} />,
                  href: "https://www.linkedin.com/in/godfrey-rayner-96b81965/",
                },
              ].map((s, i) => (
                <Link
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#aaa",
                    transition: "all 0.2s ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FFD600";
                    e.currentTarget.style.color = "#0a0a0a";
                    e.currentTarget.style.border = "1px solid #FFD600";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "#aaa";
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                  }}
                >
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* My Account */}
          <div>
            <h4
              style={{
                color: "#FFD600",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              My Account
            </h4>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                ["Track Orders", "/track-orders"],
                ["Shipping", "/shipping"],
                ["Wishlist", "/wishlist"],
                ["My Account", "/account"],
                ["Order History", "/order-history"],
                ["Returns", "/returns"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    style={{
                      color: "#888",
                      fontSize: "13.5px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FFD600")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                  >
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        background: "#FFD600",
                        borderRadius: "50%",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4
              style={{
                color: "#FFD600",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              Information
            </h4>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                ["Our Story", "/about"],
                ["Careers", "/careers"],
                ["Privacy Policy", "/privacy-policy"],
                ["Terms & Conditions", "/terms"],
                ["Latest News", "/news"],
                ["Contact Us", "/contact"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    style={{
                      color: "#888",
                      fontSize: "13.5px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FFD600")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                  >
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        background: "#FFD600",
                        borderRadius: "50%",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              style={{
                color: "#FFD600",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              Talk To Us
            </h4>

            <p style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>
              Got Questions? Call us
            </p>

            <a
              href="tel:+263717116953"
              style={{
                color: "#FFD600",
                fontSize: "22px",
                fontWeight: 800,
                textDecoration: "none",
                letterSpacing: "-0.5px",
                display: "block",
                marginBottom: "24px",
              }}
            >
              +263 717 116 953
            </a>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <a
                href="mailto:info@brandsforless.co.zw"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  textDecoration: "none",
                  color: "#888",
                  fontSize: "13px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
              >
                <Mail size={15} color="#FFD600" style={{ marginTop: "2px", flexShrink: 0 }} />
                info@brandsforless.co.zw
              </a>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <MapPin size={15} color="#FFD600" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span style={{ color: "#888", fontSize: "13px", lineHeight: 1.6 }}>
                  Shop 9, Skyline Mall
                  <br />
                  Harare, Zimbabwe
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
            margin: "48px 0 0",
          }}
        />

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            padding: "20px 0 28px",
          }}
        >
          <p style={{ color: "#555", fontSize: "12.5px", margin: 0 }}>
            © {new Date().getFullYear()} Brands for Less. All Rights Reserved.{" "}
            <Link
              href="https://www.linkedin.com/in/godfrey-rayner-96b81965/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#FFD600",
                textDecoration: "none",
                fontWeight: 600,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Godfrey Rayner
            </Link>
          </p>

          <button
            style={{
              background: "#FFD600",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(255,214,0,0.3)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,214,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,214,0,0.3)";
            }}
            aria-label="Back to top"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;