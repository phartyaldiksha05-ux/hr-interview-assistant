import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import { authApi } from "../api/auth";
import "../styles/auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("register");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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
      await register(form.email, form.password, form.fullName);

      setStep("verify");
      setSuccess(
        "Your account was created. We sent a 6-digit verification code to your email."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      await authApi.verifyOtp({
        email: form.email,
        otp,
      });

      setSuccess("Email verified successfully. Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 700);
    } catch (err) {
      setError(
        err?.message ||
          "Invalid or expired verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const response = await authApi.resendOtp({
        email: form.email,
      });

      setSuccess(
        response?.data?.message ||
          "A new verification code has been sent."
      );
      setOtp("");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to resend the verification code."
      );
    } finally {
      setResending(false);
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
              <p>Upload a resume and build candidate context.</p>
            </div>

            <div>
              <span>02</span>
              <p>Prepare smarter questions with AI assistance.</p>
            </div>

            <div>
              <span>03</span>
              <p>Turn interview notes into clear next steps.</p>
            </div>
          </div>
        </div>

        <div className="auth-panel">
          {step === "register" ? (
            <>
              <div className="auth-panel-head">
                <span className="auth-kicker">GET STARTED</span>

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
            </>
          ) : (
            <>
              <div className="auth-panel-head">
                <span className="auth-kicker">
                  VERIFY YOUR EMAIL
                </span>

                <h2>Check your inbox</h2>

                <p>
                  Enter the 6-digit verification code we sent to{" "}
                  <strong>{form.email}</strong>.
                </p>
              </div>

              <form
                className="auth-form-v2"
                onSubmit={verifyOtp}
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
                  Verification code

                  <input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setOtp(value);

                      if (error) setError("");
                    }}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                  />
                </label>

                <button
                  className="auth-submit"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                >
                  <span>
                    {loading
                      ? "Verifying..."
                      : "Verify email"}
                  </span>

                  {!loading && (
                    <span aria-hidden="true">→</span>
                  )}
                </button>
              </form>

              <div className="auth-otp-actions">
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={resendOtp}
                  disabled={resending}
                >
                  {resending
                    ? "Sending..."
                    : "Resend verification code"}
                </button>
              </div>

              <p className="auth-switch">
                Entered the wrong email?{" "}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => {
                    setStep("register");
                    setOtp("");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Go back
                </button>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}