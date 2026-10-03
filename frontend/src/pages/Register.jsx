import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import "../styles/auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await register(
        form.email,
        form.password,
        form.fullName
      );

      setSuccess(
        "Your account was created successfully. Redirecting..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 700);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page-v2">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <header className="auth-topbar">
        <Link
          to="/"
          className="auth-logo"
          aria-label="Meetwise home"
        >
          <span className="auth-logo-mark">M</span>
          <span>meetwise</span>
        </Link>
      </header>

      <section className="auth-layout-v2">
        <div className="auth-intro">
          <span className="auth-eyebrow">
            A BETTER INTERVIEW WORKFLOW
          </span>

          <h1>
            Give every candidate a <em>considered</em> experience.
          </h1>

          <p>
            Create one workspace for the people, conversations and
            decisions that move your hiring process forward.
          </p>

          <div className="auth-proof-list">
            <div>
              <span>01</span>
              <p>
                Upload a resume and build candidate context.
              </p>
            </div>

            <div>
              <span>02</span>
              <p>
                Prepare smarter questions with AI assistance.
              </p>
            </div>

            <div>
              <span>03</span>
              <p>
                Turn interview notes into clear next steps.
              </p>
            </div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-head">
            <span className="auth-kicker">
              GET STARTED
            </span>

            <h2>Create your workspace</h2>

            <p>
              Set up your account and start organizing interviews.
            </p>
          </div>

          <form
            className="auth-form-v2"
            onSubmit={submit}
          >
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="auth-success" role="status">
                {success}
              </div>
            )}

            <label>
              Full name

              <input
                name="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={update}
                placeholder="Your name"
                required
              />
            </label>

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
                autoComplete="new-password"
                value={form.password}
                onChange={update}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Creating workspace..."
                  : "Create workspace"}
              </span>

              {!loading && (
                <span aria-hidden="true">→</span>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}