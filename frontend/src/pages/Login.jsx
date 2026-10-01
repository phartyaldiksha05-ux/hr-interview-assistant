import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Unable to sign in. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page-v2">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <header className="auth-topbar">
        <Link to="/" className="auth-logo" aria-label="Meetwise home">
          <span className="auth-logo-mark">M</span>
          <span>meetwise</span>
        </Link>

        <div className="auth-top-actions">
          <span className="auth-theme-label">Appearance</span>
          <ThemeToggle />
        </div>
      </header>

      <section className="auth-layout-v2">
        <div className="auth-intro">
          <span className="auth-eyebrow">INTERVIEW WORKSPACE</span>
          <h1>Walk into every interview <em>prepared.</em></h1>
          <p>
            Keep candidate context, AI briefing, interview questions,
            scheduling and feedback together in one focused workspace.
          </p>

          <div className="auth-proof-list">
            <div><span>01</span><p>Understand the candidate before the call.</p></div>
            <div><span>02</span><p>Keep the interview plan and questions ready.</p></div>
            <div><span>03</span><p>Capture feedback while the conversation is fresh.</p></div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-head">
            <span className="auth-kicker">WELCOME BACK</span>
            <h2>Sign in to Meetwise</h2>
            <p>Pick up where your interview workflow left off.</p>
          </div>

          <form className="auth-form-v2" onSubmit={submit}>
            {error && <div className="auth-error" role="alert">{error}</div>}

            <label>
              Work email
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update}
                placeholder="you@company.com"
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={update}
                placeholder="Enter your password"
                required
              />
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              <span>{loading ? "Signing in..." : "Sign in"}</span>
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            New to Meetwise? <Link to="/register">Create your workspace</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
