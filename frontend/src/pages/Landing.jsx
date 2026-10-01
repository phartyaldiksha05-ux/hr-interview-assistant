import { Link } from "react-router-dom";
import "../styles/public.css";

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-mark">M</span>

          <span className="landing-brand-text">
            <strong>Meetwise</strong>
            <small>AI HR Interview Assistant</small>
          </span>
        </Link>

        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/login" className="landing-login-link">
            Log in
          </Link>

          <Link to="/register" className="landing-cta">
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-eyebrow">
              AI-powered interviewing
            </div>

            <h1>
              Smarter interviews.
              <br />
              <span>Better hiring decisions.</span>
            </h1>

            <p className="landing-hero-description">
              Meetwise helps HR teams manage candidates, schedule interviews,
              collect feedback, and use AI to make the interview process
              faster and more consistent.
            </p>

            <div className="landing-hero-actions">
              <Link to="/register" className="landing-primary-button">
                Get started
              </Link>

              <Link to="/login" className="landing-secondary-button">
                Sign in
              </Link>
            </div>

            <div className="landing-trust">
              <span>✓ Candidate management</span>
              <span>✓ Interview scheduling</span>
              <span>✓ AI assistance</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="landing-section landing-features"
        >
          <div className="landing-section-heading">
            <span>Everything HR needs</span>

            <h2>
              One workspace for
              <br />
              the complete interview process.
            </h2>

            <p>
              Keep your hiring workflow organized from the first candidate
              interaction to the final interview decision.
            </p>
          </div>

          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <div className="landing-feature-icon">01</div>

              <h3>Candidate management</h3>

              <p>
                Keep candidate profiles, roles, contact information, and
                interview history organized in one place.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">02</div>

              <h3>Interview scheduling</h3>

              <p>
                Schedule interviews, reschedule them when needed, and keep
                candidates informed automatically.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">03</div>

              <h3>AI interview assistance</h3>

              <p>
                Get AI-assisted interview support to help HR teams conduct
                structured and consistent interviews.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon">04</div>

              <h3>Feedback & insights</h3>

              <p>
                Capture interview feedback and keep important hiring
                information available for review.
              </p>
            </article>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="landing-section landing-workflow"
        >
          <div className="landing-section-heading">
            <span>How it works</span>

            <h2>
              A simple workflow
              <br />
              for your hiring team.
            </h2>
          </div>

          <div className="landing-steps">
            <div className="landing-step">
              <span className="landing-step-number">01</span>

              <div>
                <h3>Add candidates</h3>
                <p>
                  Create candidate profiles and keep all important details
                  organized.
                </p>
              </div>
            </div>

            <div className="landing-step">
              <span className="landing-step-number">02</span>

              <div>
                <h3>Schedule interviews</h3>
                <p>
                  Choose the interview time, type, interviewer, and meeting
                  details.
                </p>
              </div>
            </div>

            <div className="landing-step">
              <span className="landing-step-number">03</span>

              <div>
                <h3>Interview with AI support</h3>
                <p>
                  Use Meetwise to support a structured and efficient
                  interview process.
                </p>
              </div>
            </div>

            <div className="landing-step">
              <span className="landing-step-number">04</span>

              <div>
                <h3>Review and decide</h3>
                <p>
                  Review feedback and candidate information before making the
                  next hiring decision.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="landing-final-cta">
          <div>
            <span>Ready to get started?</span>

            <h2>
              Bring your interview
              <br />
              workflow into one place.
            </h2>
          </div>

          <Link to="/register" className="landing-primary-button">
            Create your account
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="landing-brand-mark">M</span>

          <span className="landing-brand-text">
            <strong>Meetwise</strong>
            <small>AI HR Interview Assistant</small>
          </span>
        </div>

        <p>© {new Date().getFullYear()} Meetwise. All rights reserved.</p>
      </footer>
    </div>
  );
}