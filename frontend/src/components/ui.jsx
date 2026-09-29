import { useState } from "react";

export const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 shadow-sm outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/20";

export const buttonClass =
  "inline-flex items-center justify-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonSecondary =
  "inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonDanger =
  "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

export function Banner({ kind = "error", children }) {
  if (!children) return null;
  const styles =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : kind === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-amber-200 bg-amber-50 text-amber-900";
  return <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>{children}</div>;
}

export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

export function ProductImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-emerald-100 text-sm text-emerald-800 ${className}`}>
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`bg-stone-100 object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
