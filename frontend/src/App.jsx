import { NavLink, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useReminderPolling } from "./hooks/useReminderPolling";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetail from "./pages/CandidateDetail";
import Interviews from "./pages/Interviews";
import InterviewDetail from "./pages/InterviewDetail";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { color, s } from "./styles/theme";
import "./styles/workspace.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/candidates", label: "Candidates" },
  { to: "/interviews", label: "Interviews" },
];

function ProtectedShell() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const { reminders, permission, requestPermission, acknowledge, soundEnabled, toggleSound } = useReminderPolling();

  if (loading) return <div style={styles.loadingScreen}>Loading your workspace…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))?.label ?? "Workspace";

  return (
    <div className="hr-shell" style={styles.shell}>
      <aside className="hr-sidebar" style={styles.sidebar}>
        <div className="workspace-brand">
  <span className="workspace-brand-mark">M</span>

  <span className="workspace-brand-text">
    <strong>Meetwise</strong>
    <small>AI HR Interview Assistant</small>
  </span>
</div>
        <nav aria-label="Workspace navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.userName}>{user.full_name}</div>
          <button onClick={logout} style={styles.logoutButton}>Log out</button>
        </div>
      </aside>

      <div className="hr-main" style={styles.main}>
        <header className="workspace-topbar" style={styles.topbar}>
          <div className="workspace-topbar-inner">
            <div className="workspace-topbar-title">
              <span className="workspace-topbar-dot" />
              <strong>{current}</strong>
              <span>Hiring workspace</span>
            </div>
            <div className="workspace-topbar-actions">
              {reminders.length > 0 && <span style={styles.bell}>● {reminders.length} reminder{reminders.length > 1 ? "s" : ""}</span>}
              {permission !== "granted" && permission !== "unsupported" && (
                <button onClick={requestPermission} style={s.buttonSecondary}>Enable notifications</button>
              )}
              <label className="reminder-sound-toggle"><input type="checkbox" checked={soundEnabled} onChange={toggleSound} disabled={permission !== "granted"} /> Sound</label>
            </div>
          </div>
        </header>

        <div className="hr-content" style={styles.content}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard reminders={reminders} onAcknowledge={acknowledge} />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/interviews" element={<Interviews reminders={reminders} onAcknowledge={acknowledge} />} />
            <Route path="/interviews/:id" element={<InterviewDetail />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={styles.loadingScreen}>Loading…</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/*" element={<ProtectedShell />} />
      </Routes>
    </AuthProvider>
  );
}

const styles = {
  loadingScreen: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: s.page.fontFamily, color: color.textLow, background: color.canvas },
  shell: { display: "flex", minHeight: "100vh", fontFamily: s.page.fontFamily, background: color.canvas },
  sidebar: { flexShrink: 0, display: "flex", flexDirection: "column" },
  logo: { display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 17, letterSpacing: "-.02em" },
  logoMark: { display: "flex", alignItems: "center", justifyContent: "center" },
  sidebarFooter: { marginTop: "auto" },
  userName: {},
  logoutButton: { cursor: "pointer", fontFamily: s.page.fontFamily },
  main: { flex: 1, minWidth: 0 },
  topbar: { display: "flex", alignItems: "center" },
  content: { flex: 1 },
  bell: { padding: "7px 10px", borderRadius: 999, background: "var(--mw-accent-soft)", color: "var(--mw-accent-strong)", fontSize: 11, fontWeight: 800 },
};
