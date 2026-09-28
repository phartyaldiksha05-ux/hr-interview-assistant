import { NavLink, Navigate, Routes, Route } from "react-router-dom";
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

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/candidates", label: "Candidates" },
  { to: "/interviews", label: "Interviews" },
];

function ProtectedShell() {
  const { user, loading, logout } = useAuth();
  const { reminders, permission, requestPermission, acknowledge, soundEnabled, toggleSound } = useReminderPolling();

  if (loading) return <div style={styles.loadingScreen}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="hr-shell" style={styles.shell}>
      <aside className="hr-sidebar" style={styles.sidebar}>
        <div style={styles.logo}>
          <span className="hr-brand-symbol" style={styles.logoMark}><i /><i /><i /></span>
          <span>meetwise</span>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}
            >
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
        <header style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {reminders.length > 0 && <span style={styles.bell}>🔴 {reminders.length} active</span>}
            {permission !== "granted" && permission !== "unsupported" && (
              <button onClick={requestPermission} style={s.buttonSecondary}>Enable browser notifications</button>
            )}
            <label className="reminder-sound-toggle"><input type="checkbox" checked={soundEnabled} onChange={toggleSound} disabled={permission !== "granted"} /> Reminder sound</label>
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
  loadingScreen: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: s.page.fontFamily, color: color.textLow },
  shell: { display: "flex", minHeight: "100vh", fontFamily: s.page.fontFamily, background: color.canvas },
  sidebar: { width: 228, background: "#261a3b", color: "#f4f0f8", padding: "1.5rem 1rem", flexShrink: 0, display: "flex", flexDirection: "column" },
  logo: { display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 16, letterSpacing: 0, marginBottom: "1.75rem", paddingLeft: 6 },
  logoMark: { width: 28, height: 28, borderRadius: 8, background: "#b4f2d0", color: "#261a3b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 },
  navLink: {
    display: "block", padding: "0.65rem 0.8rem", borderRadius: 6, color: "#c1b7cf",
    textDecoration: "none", fontSize: 13, marginBottom: 4, borderLeft: "3px solid transparent",
  },
  navLinkActive: { color: "#fff", borderLeft: "3px solid #b4f2d0", background: "#38294e", fontWeight: 600 },
  sidebarFooter: { marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #403250" },
  userName: { fontSize: 12, color: "#c1b7cf", padding: "0 6px", marginBottom: 8 },
  logoutButton: { width: "100%", padding: "0.55rem", borderRadius: 6, border: "1px solid #514260", background: "transparent", color: "#d2c9df", cursor: "pointer", fontSize: 12, fontFamily: s.page.fontFamily },
  topbar: { background: "#fff", borderBottom: `1px solid ${color.border}`, padding: "0.75rem 1.75rem", display: "flex", justifyContent: "flex-end" },
  bell: { background: "#fff0ef", color: color.alarm, padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  content: { flex: 1, padding: "2rem 2.25rem", maxWidth: 1500 },
};
