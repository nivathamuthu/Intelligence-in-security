export function formatMoney(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function apiError(error, fallback = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        const field = Array.isArray(item.loc)
          ? item.loc.filter((part) => part !== "body").join(" ")
          : "";
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .filter(Boolean)
      .join(" ");
  }
  return fallback;
}
