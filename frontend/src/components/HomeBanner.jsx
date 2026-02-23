import { useEffect, useState, useRef } from "react";
import api from "../lib/api";

export default function HomeBanner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    api
      .get("/config/banners")
      .then((res) => setBanners(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-advance if multiple banners
  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [banners]);

  if (loading)
    return (
      <div
        className="skeleton"
        style={{ height: 160, borderRadius: 14, marginBottom: 16 }}
      />
    );

  if (dismissed || banners.length === 0) return null;

  const banner = banners[current];

  function handleClick() {
    if (banner.linkUrl) window.open(banner.linkUrl, "_blank");
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 16,
        background: "var(--tg-theme-section-bg-color)",
      }}
    >
      {/* Image */}
      <img
        src={banner.imageUrl}
        alt="Banner"
        onClick={handleClick}
        style={{
          width: "100%",
          height: 160,
          objectFit: "cover",
          display: "block",
          cursor: banner.linkUrl ? "pointer" : "default",
          transition: "opacity .3s",
        }}
      />

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "rgba(0,0,0,.4)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M1 1l9 9M10 1L1 10"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Pagination dots */}
      {banners.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 5,
          }}
        >
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrent(i);
                clearInterval(timerRef.current);
              }}
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                borderRadius: 3,
                padding: 0,
                background: i === current ? "#fff" : "rgba(255,255,255,.45)",
                border: "none",
                cursor: "pointer",
                transition: "width .25s, background .25s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
