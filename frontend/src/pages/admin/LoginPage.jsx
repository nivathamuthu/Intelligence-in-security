import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Banner, Field, buttonClass, inputClass } from "../../components/ui";
import { apiError } from "../../utils/format";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin/products" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!username.trim()) nextErrors.username = "Username is required.";
    if (!password.trim()) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate("/admin/products");
    } catch (err) {
      setFormError(apiError(err, "Login failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
      <h1 className="font-serif text-3xl">Admin login</h1>
      <p className="mt-1 text-sm text-stone-600">Customers shop without an account. This sign-in is for the farm manager.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <Banner>{formError}</Banner>
        <Field label="Username" error={errors.username}>
          <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <button className={`${buttonClass} w-full`} type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
