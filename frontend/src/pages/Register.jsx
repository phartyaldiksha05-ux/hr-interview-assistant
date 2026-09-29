import ThemeToggle from "../components/ThemeToggle";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("Enter your full name to create an account.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, fullName.trim());
      navigate("/dashboard");
    } catch (err) {
      setError(err.message ?? "Registration failed");
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
          <span className="auth-eyebrow">A better way to bring people in</span>
          <h1>Good hiring is a team sport.</h1>
          <p>Give every candidate a considered experience, and give your team the context to make confident decisions.</p>
          <div className="auth-story-rule"><span /> One clear view of your hiring process</div>
        </section>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-heading">
            <span className="auth-form-overline">Get started</span>
            <h2>Create your workspace</h2>
            <p>Set up your account to start organizing interviews.</p>
          </div>
          <label className="auth-field">
            Full name
            <input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" maxLength={200} required />
          </label>
          <label className="auth-field">
            Work email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          </label>
          <label className="auth-field">
            Password
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} maxLength={128} required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? <><span className="auth-spinner" /> Creating your account…</> : <>Create account <span aria-hidden="true">→</span></>}
          </button>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </form>
      </div>
      <div className="auth-bottom"><Link to="/">Back to home</Link><span>Thoughtful hiring starts here.</span></div>
    </div>
  );
}
