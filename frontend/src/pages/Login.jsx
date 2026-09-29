import ThemeToggle from "../components/ThemeToggle";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <ThemeToggle className="auth-theme-toggle" />
      <Link className="auth-brand" to="/" aria-label="Meetwise home"><span className="brand-symbol"><i /><i /><i /></span>meetwise</Link>
      <div className="auth-layout">
        <section className="auth-story">
          <span className="auth-eyebrow">Your hiring, in sync</span>
          <h1>Make every conversation count.</h1>
          <p>Bring candidate context, thoughtful interviews, and timely follow-ups into one calm workspace.</p>
          <div className="auth-story-rule"><span /> Built for better hiring decisions</div>
        </section>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-heading">
            <span className="auth-form-overline">Welcome back</span>
            <h2>Sign in to your workspace</h2>
            <p>Pick up where your team left off.</p>
          </div>
          <label className="auth-field">
            Email address
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          </label>
          <label className="auth-field">
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? <><span className="auth-spinner" /> Signing in…</> : <>Sign in <span aria-hidden="true">→</span></>}
          </button>
          <p className="auth-switch">New to Meetwise? <Link to="/register">Create an account</Link></p>
        </form>
      </div>
      <div className="auth-bottom"><Link to="/">Back to home</Link><span>Thoughtful hiring starts here.</span></div>
    </div>
  );
}
