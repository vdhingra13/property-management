import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const defaultForm = {
  name: "",
  email: "owner@harborpm.com",
  password: "password123"
};

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Property Management Platform</p>
        <h1>Harbor PM</h1>
        <p className="auth-copy">
          Run leasing, collections, maintenance, and occupancy from one focused workspace.
        </p>
        <div className="auth-note">
          <strong>Demo seed:</strong> `owner@harborpm.com` / `password123`
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-switch">
          <button
            className={mode === "login" ? "nav-chip active" : "nav-chip"}
            onClick={() => setMode("login")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === "register" ? "nav-chip active" : "nav-chip"}
            onClick={() => setMode("register")}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              <span>Full name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Vishal Mehta"
                required
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-action" type="submit" disabled={submitting}>
            {submitting ? "Working..." : mode === "login" ? "Enter dashboard" : "Create workspace"}
          </button>
        </form>
      </section>
    </div>
  );
}
