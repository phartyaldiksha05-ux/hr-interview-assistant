import ThemeToggle from "../components/ThemeToggle";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    number: "01",
    title: "Understand every resume",
    text: "Turn resume details into a clear picture of strengths, experience, and the questions worth asking.",
    tag: "AI resume insights",
  },
  {
    number: "02",
    title: "Keep your pipeline in view",
    text: "Bring candidate profiles and next steps together, so good people never disappear into a spreadsheet.",
    tag: "Candidate management",
  },
  {
    number: "03",
    title: "Make time for the conversation",
    text: "Coordinate interview details, interviewer context, and meeting links from one considered workspace.",
    tag: "Interview scheduling",
  },
  {
    number: "04",
    title: "Follow through, naturally",
    text: "Get timely reminders before interviews and keep every follow-up moving at the right moment.",
    tag: "Intelligent reminders",
  },
];

function Brand({ light = false }) {
  return (
    <Link className={`brand${light ? " brand-light" : ""}`} to="/" aria-label="Meetwise home">
      <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
      <span>meetwise</span>
    </Link>
  );
}

const WORKFLOW = [
  { number: "01", title: "Upload Resume", detail: "Add a candidate's PDF", icon: "↑", tone: "mint", to: "/candidates" },
  { number: "02", title: "AI Candidate Briefing", detail: "Review strengths and focus areas", icon: "✳", tone: "lilac", to: "/candidates" },
  { number: "03", title: "Schedule Interview", detail: "Choose a time and format", icon: "▦", tone: "peach", to: "/interviews" },
  { number: "04", title: "Smart Reminders", detail: "Stay ready for what's next", icon: "◷", tone: "mint", to: "/dashboard" },
  { number: "05", title: "Interview Questions", detail: "Prepare a thoughtful conversation", icon: "⌕", tone: "lilac", to: "/candidates" },
  { number: "06", title: "HR Feedback", detail: "Capture notes and next steps", icon: "✎", tone: "peach", to: "/interviews" },
];

function ProductPreview() {
  return (
    <div className="workflow-preview" aria-label="Product preview showing the six-step interview workflow">
      <div className="workflow-preview-head">
        <span className="workflow-preview-label"><i /> MEETWISE WORKFLOW</span>
        <span className="workflow-preview-mode">A considered process, start to finish</span>
      </div>
      <div className="workflow-track" aria-label="Upload Resume, AI Candidate Briefing, Schedule Interview, Smart Reminders, Interview Questions, HR Feedback">
        {WORKFLOW.map((step, index) => (
          <Link className={`workflow-step workflow-step-${step.tone}`} key={step.number} to={step.to} aria-label={`${step.title}: ${step.detail}`}>
            <div className="workflow-step-top"><span className="workflow-step-icon">{step.icon}</span><span className="workflow-step-number">{step.number}</span></div>
            <strong>{step.title}</strong>
            <span className="workflow-step-detail">{step.detail}</span>
            {index < WORKFLOW.length - 1 && <span className="workflow-connector" aria-hidden="true">→</span>}
          </Link>
        ))}
      </div>
      <div className="workflow-preview-footer"><span><i /> From first look to considered feedback</span><span>AI assists. People decide.</span></div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="landing-page">
      <div className="landing-grid" aria-hidden="true" />
      <header className="site-header">
        <Brand light />
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="site-actions">
          <ThemeToggle />
          <Link className="site-login" to="/login">Log in</Link>
          <Link className="site-cta" to="/register">Get started <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="hero-eyebrow"><span className="eyebrow-spark">✳</span> AN AI HR ASSISTANT FOR THOUGHTFUL TEAMS</div>
          <h1>Less Admin.<br /><span>Better Interviews.</span></h1>
          <p className="hero-description">From the first resume to the final feedback, Meetwise helps you prepare well and make more room for the human conversation.</p>
          <div className="hero-actions">
            <Link className="hero-primary" to="/register">Get started <span aria-hidden="true">↗</span></Link>
            <Link className="hero-secondary" to="/login"><span className="play-symbol" aria-hidden="true">→</span> Log in to your workspace</Link>
          </div>
          <div className="hero-footnote"><span className="footnote-mark">✓</span> Made for people-first hiring teams</div>
        </div>
        <ProductPreview />
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-intro"><span className="section-overline">HOW IT WORKS</span><h2>One clear path<br /><span>through every interview.</span></h2><p>Keep the useful details close, from the first resume review to the feedback that comes after.</p></div>
        <div className="how-phases">
          <article className="how-phase"><span>01 / UNDERSTAND</span><div className="how-phase-icon">↑ <b>✳</b></div><h3>Start with context</h3><p>Upload a resume and let AI organize strengths, gaps, and focus areas into a candidate briefing.</p><small>Upload Resume <i>→</i> AI Candidate Briefing</small></article>
          <article className="how-phase"><span>02 / COORDINATE</span><div className="how-phase-icon">▦ <b>◷</b></div><h3>Make space to meet</h3><p>Schedule the interview, stay ahead of reminders, and keep the next step clear for everyone.</p><small>Schedule Interview <i>→</i> Smart Reminders</small></article>
          <article className="how-phase"><span>03 / REFLECT</span><div className="how-phase-icon">⌕ <b>✎</b></div><h3>Close the loop</h3><p>Prepare useful questions, capture HR feedback, and leave the conversation with a thoughtful next step.</p><small>Interview Questions <i>→</i> HR Feedback</small></article>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="features-intro">
          <div><span className="section-overline">Features</span><h2>One thoughtful flow.<br /><span>Every interview.</span></h2></div>
          <p>Resume insights, candidate context, scheduling, reminders, and feedback work together in one place, so your attention stays on people.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article className="feature-item" key={feature.number}>
              <div className="feature-top"><span className="feature-number">{feature.number}</span><span className="feature-arrow" aria-hidden="true">↗</span></div>
              <span className="feature-tag">{feature.tag}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-band">
        <div><span className="section-overline">Make room for better conversations</span><h2>Spend less time coordinating.<br />More time connecting.</h2></div>
        <Link className="closing-cta" to="/register">Get started <span aria-hidden="true">↗</span></Link>
      </section>
      <footer className="site-footer"><Brand light /><span>Thoughtful hiring, in sync.</span><Link to="/login">Log in</Link></footer>
    </main>
  );
}