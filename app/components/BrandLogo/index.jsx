/** @format */

import styles from "./index.module.scss";

function getInitials(name) {
  if (!name || typeof name !== "string") return "BR";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "BR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function BrandLogo({ logo, companyName, size = 40 }) {
  if (logo) {
    return (
      <img
        alt={companyName || "logo"}
        src={logo}
        width={size}
        height={size}
        className={styles.logo}
      />
    );
  }

  return (
    <div
      className={styles.fallback}
      style={{ width: size, height: size }}
      aria-label={companyName || "logo"}
    >
      {getInitials(companyName)}
    </div>
  );
}
