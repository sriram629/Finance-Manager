import { ArrowRight, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Check, Download, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/context/AuthContext";
import "./landing.css";

const weeks = [
  { label: "Week 1", income: 1100, expenses: 580 },
  { label: "Week 2", income: 950, expenses: 720 },
  { label: "Week 3", income: 1200, expenses: 620 },
  { label: "Week 4", income: 1000, expenses: 510 },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const destination = isAuthenticated ? "/home" : "/register";
  const cta = isAuthenticated ? "Open your dashboard" : "Get started";

  return (
    <div className="landing">
      <a className="landing-skip" href="#main">Skip to content</a>
      <header className="landing-nav landing-container">
        <Brand />
        <nav aria-label="Main navigation">
          <a className="landing-features-link" href="#features">Features</a>
          <Link to={isAuthenticated ? "/home" : "/login"}>{isAuthenticated ? "Dashboard" : "Log in"}</Link>
          <Link className="landing-button landing-button-small" to={destination}>{isAuthenticated ? "Open app" : "Create account"}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        </nav>
      </header>

      <main id="main">
        <section className="landing-hero landing-container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="landing-eyebrow"><span /> YOUR MONEY, IN PERSPECTIVE</p>
            <h1 id="hero-title">More clarity.<br />Less money<br /><span>guesswork.</span></h1>
            <p className="hero-description">From your next shift to your last receipt. Bring income, expenses, and work schedules together, and see where you stand.</p>
            <div className="hero-actions">
              <Link className="landing-button" to={destination}>{cta}<ArrowRight size={18} aria-hidden="true" /></Link>
              <a className="landing-text-link" href="#overview">Take a look <span aria-hidden="true">↗</span></a>
            </div>
            <p className="hero-note"><Check size={15} aria-hidden="true" /> Built for full-time lives and part-time work.</p>
          </div>

          <div className="hero-preview" id="overview">
            <div className="preview-topline"><span><span className="preview-dot" /> THE BIG PICTURE</span><span>Example overview</span></div>
            <div className="preview-heading"><div><p>Your month at a glance</p><h2>Looking ahead feels good.</h2></div><CalendarDays size={20} aria-hidden="true" /></div>
            <div className="preview-balance"><span>Net income</span><strong>$1,820<span>.00</span></strong><p>Income minus expenses. All in one place.</p></div>
            <div className="preview-totals"><div><span><i /> Income</span><strong>$4,250.00</strong></div><div><span><i /> Expenses</span><strong>$2,430.00</strong></div></div>
            <figure className="preview-chart">
              <figcaption><strong>A little perspective</strong><span>Income & expenses</span></figcaption>
              <div className="chart-bars" role="img" aria-label="Example weekly income and expenses: Week 1, $1,100 and $580. Week 2, $950 and $720. Week 3, $1,200 and $620. Week 4, $1,000 and $510.">
                {weeks.map(week => <div className="chart-week" key={week.label}><div className="chart-pair"><span style={{ height: `${week.income / 12}%` }} /><span style={{ height: `${week.expenses / 12}%` }} /></div><span>{week.label}</span></div>)}
              </div>
            </figure>
            <div className="preview-shift"><span className="shift-icon"><CalendarDays size={20} aria-hidden="true" /></span><div><strong>Your next shift</strong><span>Part-time · Tomorrow, 9:00 AM</span></div><span className="shift-hours">4 hours</span></div>
          </div>
        </section>

        <section id="features" className="landing-features landing-container" aria-labelledby="features-title">
          <div className="features-intro"><p className="landing-eyebrow">A PLACE FOR EVERY PART</p><h2 id="features-title">Life has moving parts.<br />Your finances can fit together.</h2><p>Keep the details organized, so the bigger picture is easier to see.</p></div>
          <div className="feature-list">
            {[
              { icon: CalendarDays, title: "Turn work into a clearer income picture", text: "Track hourly shifts and fixed salaries. Add recurring schedules or import them in bulk with CSV." },
              { icon: ReceiptText, title: "Give every expense a place", text: "Log spending by category and keep receipts alongside your expenses. See what adds up over time." },
              { icon: Download, title: "Take your numbers with you", text: "Choose a date range and export your schedules, expenses, or full report as PDF, CSV, or Excel." },
            ].map(({ icon: Icon, title, text }, index) => <article className="feature-row" key={title}><Icon size={23} strokeWidth={1.5} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div><span className="feature-number">0{index + 1}</span></article>)}
          </div>
        </section>

        <section className="landing-cta landing-container" aria-labelledby="cta-title"><ChartNoAxesCombined size={28} strokeWidth={1.5} aria-hidden="true" /><div><h2 id="cta-title">Make room for a clearer month.</h2><p>Your income, your spending, your next step.</p></div><Link className="landing-button" to={destination}>{cta}<ArrowRight size={18} aria-hidden="true" /></Link></section>
      </main>
      <footer className="landing-footer landing-container"><Brand /><p>A clearer view of your everyday finances.</p><Link to={isAuthenticated ? "/home" : "/login"}>{isAuthenticated ? "Go to dashboard" : "Sign in"}<ArrowUpRight size={15} aria-hidden="true" /></Link></footer>
    </div>
  );
}
