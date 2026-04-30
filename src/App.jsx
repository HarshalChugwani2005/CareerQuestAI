import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useCallback } from "react";

/* ── API Layer ─────────────────────────────────────────────── */
const API_BASE = "http://localhost:8000";

async function api(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new Event("auth-expired"));
  }
  const data = await res.json();
  if (!res.ok) throw { status: res.status, detail: data.detail || "Request failed" };
  return data;
}

/* ── Animation Variants ────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

/* ── Auth Forms ────────────────────────────────────────────── */
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, role }),
        });
        setMode("login");
        setError("");
      }
      if (mode === "login" || mode === "register") {
        const tokens = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        onLogin();
      }
    } catch (err) {
      setError(err.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <motion.div className="auth-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="auth-brand">
          <span className="logo-mark">CareerQuestAI</span>
          <span className="logo-sub">RAVi – Risk-Adjusted Vocational Intelligence</span>
        </div>
        <form onSubmit={submit} className="auth-form">
          <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
          {mode === "register" && (
            <input
              id="auth-name"
              className="input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          )}
          <input
            id="auth-email"
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            id="auth-password"
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {mode === "register" && (
            <div className="role-pick">
              <button
                type="button"
                className={`role-btn ${role === "student" ? "active" : ""}`}
                onClick={() => setRole("student")}
              >
                Student
              </button>
              <button
                type="button"
                className={`role-btn ${role === "lender" ? "active" : ""}`}
                onClick={() => setRole("lender")}
              >
                Lender
              </button>
            </div>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Register"}
          </button>
          <p className="auth-toggle">
            {mode === "login" ? "No account? " : "Have an account? "}
            <button type="button" className="link-btn" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

/* ── SHAP Waterfall ────────────────────────────────────────── */
function buildWaterfall(contributions, baseScore) {
  let running = baseScore;
  return contributions.map((item) => {
    const start = running;
    const end = running + item.contribution;
    running = end;
    return { ...item, start, end, positive: item.contribution >= 0 };
  });
}

function WaterfallChart({ contributions }) {
  const baseScore = 0.5;
  const range = 0.6;
  const chart = buildWaterfall(contributions, baseScore);

  return (
    <svg viewBox="0 0 640 320" className="waterfall" aria-hidden="true">
      <line x1="80" y1="40" x2="80" y2="280" className="axis" />
      <line x1="80" y1="280" x2="600" y2="280" className="axis" />
      {chart.map((bar, index) => {
        const x = 100 + index * (480 / Math.max(chart.length, 1));
        const startY = 280 - ((bar.start - (baseScore - range)) / (2 * range)) * 220;
        const endY = 280 - ((bar.end - (baseScore - range)) / (2 * range)) * 220;
        const height = Math.max(6, Math.abs(endY - startY));
        const y = Math.min(startY, endY);
        return (
          <g key={bar.feature}>
            <rect x={x} y={y} width="38" height={height} rx="6" className={bar.positive ? "bar positive" : "bar negative"} />
            <text x={x + 19} y={300} textAnchor="middle" className="bar-label">{bar.feature.split("_")[0]}</text>
            <text x={x + 19} y={y - 8} textAnchor="middle" className="bar-value">
              {bar.contribution > 0 ? "+" : ""}{(bar.contribution * 100).toFixed(0)}
            </text>
          </g>
        );
      })}
      <text x="20" y="60" className="axis-label">Higher</text>
      <text x="20" y="280" className="axis-label">Lower</text>
    </svg>
  );
}

/* ── Score Calculator Page ─────────────────────────────────── */
function ScorePage() {
  const [form, setForm] = useState({
    cgpa: 8.0, college_tier: 2, course_type: "stem",
    city_demand_index: 85, certifications_count: 3,
    internships: 1, github_score: 60, application_velocity: 10,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/ml/score", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          cgpa: parseFloat(form.cgpa),
          college_tier: parseInt(form.college_tier),
          city_demand_index: parseFloat(form.city_demand_index),
          certifications_count: parseInt(form.certifications_count),
          internships: parseInt(form.internships),
          github_score: parseFloat(form.github_score),
          application_velocity: parseInt(form.application_velocity),
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err.detail || "Scoring failed");
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.section className="page-section" variants={fadeUp} initial="hidden" animate="show">
      <div className="banner">
        <div>
          <p className="eyebrow">ML Scoring Engine</p>
          <h1>Employability Score Calculator</h1>
        </div>
        <div className="badge-row">
          <span className="status-badge">XGBoost v1.0</span>
          <span className="status-badge">SHAP Explanations</span>
        </div>
      </div>

      <div className="layout">
        <div className="panel">
          <div className="panel-head"><div><p className="eyebrow">Input Features</p><h2>Student Profile</h2></div></div>
          <form className="score-form" onSubmit={calculate}>
            <div className="form-grid">
              <label>
                <span>CGPA</span>
                <input className="input" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={(e) => update("cgpa", e.target.value)} />
              </label>
              <label>
                <span>College Tier</span>
                <select className="input" value={form.college_tier} onChange={(e) => update("college_tier", e.target.value)}>
                  <option value={1}>Tier 1 (IIT/IISC)</option>
                  <option value={2}>Tier 2 (NIT/IIIT)</option>
                  <option value={3}>Tier 3 (Regional)</option>
                </select>
              </label>
              <label>
                <span>Course Type</span>
                <select className="input" value={form.course_type} onChange={(e) => update("course_type", e.target.value)}>
                  <option value="stem">STEM</option>
                  <option value="business">Business</option>
                  <option value="arts">Arts</option>
                </select>
              </label>
              <label>
                <span>City Demand Index</span>
                <input className="input" type="number" min="0" max="100" value={form.city_demand_index} onChange={(e) => update("city_demand_index", e.target.value)} />
              </label>
              <label>
                <span>Certifications</span>
                <input className="input" type="number" min="0" max="20" value={form.certifications_count} onChange={(e) => update("certifications_count", e.target.value)} />
              </label>
              <label>
                <span>Internships</span>
                <input className="input" type="number" min="0" max="10" value={form.internships} onChange={(e) => update("internships", e.target.value)} />
              </label>
              <label>
                <span>GitHub Score</span>
                <input className="input" type="number" min="0" max="100" value={form.github_score} onChange={(e) => update("github_score", e.target.value)} />
              </label>
              <label>
                <span>App Velocity</span>
                <input className="input" type="number" min="0" max="100" value={form.application_velocity} onChange={(e) => update("application_velocity", e.target.value)} />
              </label>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="primary" disabled={loading}>
              {loading ? "Computing…" : "Calculate Score"}
            </button>
          </form>
        </div>

        <div className="panel detail">
          <div className="panel-head">
            <div><p className="eyebrow">Prediction Result</p><h2>Score Breakdown</h2></div>
            {result && <span className="decision-chip">Score {result.employability_score}</span>}
          </div>
          {result ? (
            <>
              <div className="score-hero">
                <div className="score-ring" style={{ "--score": result.employability_score }}>
                  <span className="score-number">{result.employability_score}</span>
                  <span className="score-label">/ 100</span>
                </div>
                <div className="score-stats">
                  <div><span>Placement Probability</span><strong>{(result.placement_probability * 100).toFixed(1)}%</strong></div>
                  <div><span>Predicted Salary</span><strong>₹{result.predicted_salary.toLocaleString("en-IN")}</strong></div>
                  <div><span>Model</span><strong>{result.model_version}</strong></div>
                </div>
              </div>
              <div className="waterfall-wrap">
                <p className="eyebrow" style={{ marginBottom: 8 }}>SHAP Feature Contributions</p>
                <WaterfallChart contributions={result.top_contributions} />
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Enter student features and click <strong>Calculate Score</strong> to see predictions with SHAP explanations.</p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/* ── IRR Savings Page ──────────────────────────────────────── */
function IRRPage() {
  const [studentId, setStudentId] = useState("");
  const [savings, setSavings] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSavings = async (e) => {
    e.preventDefault();
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const [savingsData, milestonesData] = await Promise.all([
        api(`/irr/${studentId}/savings`),
        api(`/milestones/${studentId}`),
      ]);
      setSavings(savingsData);
      setMilestones(milestonesData);
    } catch (err) {
      setError(err.detail || "Failed to load IRR data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section className="page-section" variants={fadeUp} initial="hidden" animate="show">
      <div className="banner">
        <div>
          <p className="eyebrow">Interest Rate Reduction</p>
          <h1>Milestone-Based Rate Savings</h1>
        </div>
        <div className="badge-row">
          <span className="status-badge">Max 150 BPS</span>
          <span className="status-badge">Real-time IRR</span>
        </div>
      </div>

      <div className="layout">
        <div className="panel">
          <div className="panel-head"><div><p className="eyebrow">Lookup</p><h2>Student Savings</h2></div></div>
          <form className="irr-form" onSubmit={fetchSavings}>
            <label><span>Student ID</span>
              <input className="input" type="number" min="1" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Enter student ID" required />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="primary" disabled={loading}>{loading ? "Loading…" : "Calculate Savings"}</button>
          </form>

          {milestones && (
            <div className="milestones-list">
              <p className="eyebrow" style={{ marginTop: 16 }}>Completed Milestones</p>
              {milestones.items.length > 0 ? (
                <table>
                  <thead><tr><th>Type</th><th>BPS Earned</th><th>Date</th></tr></thead>
                  <tbody>
                    {milestones.items.map((m) => (
                      <tr key={m.id}>
                        <td><span className="milestone-badge">{m.type.replace("_", " ")}</span></td>
                        <td><strong>{m.bps_earned}</strong> bps</td>
                        <td>{m.completed_at ? new Date(m.completed_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state-text">No milestones recorded yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="panel detail">
          <div className="panel-head"><div><p className="eyebrow">Savings Summary</p><h2>Rate Breakdown</h2></div></div>
          {savings ? (
            <div className="irr-result">
              <div className="irr-visual">
                <div className="irr-bar-container">
                  <div className="irr-bar base" style={{ width: "100%" }}>
                    <span>Base Rate: {savings.base_rate}%</span>
                  </div>
                  <div className="irr-bar effective" style={{ width: `${(savings.effective_rate / savings.base_rate) * 100}%` }}>
                    <span>Effective: {savings.effective_rate}%</span>
                  </div>
                </div>
              </div>
              <div className="detail-meta">
                <div><span>Total BPS Earned</span><strong>{savings.total_bps} bps</strong></div>
                <div><span>Rate Reduction</span><strong>{(savings.total_bps / 100).toFixed(2)}%</strong></div>
                <div><span>Interest Saved</span><strong className="savings-amount">₹{savings.savings_inr.toLocaleString("en-IN")}</strong></div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Enter a student ID to view their milestone-based interest rate savings.</p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/* ── Dashboard Page (Audit Log) ────────────────────────────── */
function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/students?limit=50&offset=0&sort_by=id&order=desc");
        setStudents(data.items || []);
      } catch (err) {
        // If we get a 403 (not lender), show an informational message
        if (err.status === 403) {
          setError("Student accounts can view their own profile via the Score page.");
        } else {
          setError(err.detail || "Failed to load students");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectStudent = async (student) => {
    setSelected(student);
    setScoreResult(null);
    // If the student has a score, we already have it from latest_score
  };

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return students;
    return students.filter((s) =>
      [s.college, s.course, s.city, String(s.id), String(s.latest_score)]
        .join(" ").toLowerCase().includes(lower)
    );
  }, [query, students]);

  const riskClass = (level) => {
    if (level === "high") return "decline";
    if (level === "medium") return "review";
    return "approve";
  };

  return (
    <motion.section className="page-section" variants={fadeUp} initial="hidden" animate="show">
      <div className="banner">
        <div>
          <p className="eyebrow">Lender Dashboard</p>
          <h1>Student Risk Overview</h1>
        </div>
        <div className="badge-row">
          <span className="status-badge">Live Data ✓</span>
          <span className="status-badge">API Connected ✓</span>
        </div>
      </div>

      {error ? (
        <div className="panel"><div className="empty-state"><p>{error}</p></div></div>
      ) : (
        <div className="layout">
          <div className="panel">
            <div className="panel-head">
              <div><p className="eyebrow">Student List</p><h2>Risk Assessment</h2></div>
              <input className="search" placeholder="Search college, course, city…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {loading ? (
              <div className="empty-state"><p>Loading students…</p></div>
            ) : (
              <table>
                <thead>
                  <tr><th>ID</th><th>College</th><th>Course</th><th>CGPA</th><th>Score</th><th>Risk</th></tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} onClick={() => selectStudent(s)} className={selected?.id === s.id ? "selected" : ""}>
                      <td>{s.id}</td>
                      <td>{s.college}</td>
                      <td>{s.course}</td>
                      <td>{s.cgpa}</td>
                      <td>{s.latest_score ?? "—"}</td>
                      <td>
                        {s.risk_level ? (
                          <span className={`decision ${riskClass(s.risk_level)}`}>{s.risk_level}</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel detail">
            <div className="panel-head">
              <div><p className="eyebrow">Student Detail</p><h2>{selected ? `${selected.college}` : "Select a student"}</h2></div>
              {selected?.latest_score && <span className="decision-chip">Score {selected.latest_score}</span>}
            </div>
            {selected ? (
              <div className="detail-meta detail-meta-wide">
                <div><span>Student ID</span><strong>{selected.id}</strong></div>
                <div><span>College</span><strong>{selected.college}</strong></div>
                <div><span>Course</span><strong>{selected.course}</strong></div>
                <div><span>CGPA</span><strong>{selected.cgpa}</strong></div>
                <div><span>Graduation Year</span><strong>{selected.graduation_year}</strong></div>
                <div><span>City</span><strong>{selected.city}</strong></div>
                <div><span>Latest Score</span><strong>{selected.latest_score ?? "Not scored"}</strong></div>
                <div><span>Risk Level</span><strong className={selected.risk_level ? riskClass(selected.risk_level) : ""}>{selected.risk_level ?? "N/A"}</strong></div>
              </div>
            ) : (
              <div className="empty-state"><p>Click a student row to see details.</p></div>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}

/* ── Profile Page ──────────────────────────────────────────── */
function ProfilePage({ user, onLogout }) {
  return (
    <motion.section className="page-section" variants={fadeUp} initial="hidden" animate="show">
      <div className="banner">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Your Profile</h1>
        </div>
      </div>
      <div className="panel" style={{ maxWidth: 540 }}>
        <div className="detail-meta detail-meta-wide">
          <div><span>Name</span><strong>{user.name}</strong></div>
          <div><span>Email</span><strong>{user.email}</strong></div>
          <div><span>Role</span><strong className="capitalize">{user.role}</strong></div>
          <div><span>Joined</span><strong>{new Date(user.created_at).toLocaleDateString()}</strong></div>
        </div>
        <button className="ghost" onClick={onLogout} style={{ marginTop: 16 }}>Sign out</button>
      </div>
    </motion.section>
  );
}

/* ── Main App ──────────────────────────────────────────────── */
const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "score", label: "Score", icon: "🎯" },
  { id: "irr", label: "IRR Savings", icon: "💰" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const fetchUser = useCallback(async () => {
    try {
      const u = await api("/auth/me");
      setUser(u);
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchUser();
    const handler = () => setAuthed(false);
    window.addEventListener("auth-expired", handler);
    return () => window.removeEventListener("auth-expired", handler);
  }, [authed, fetchUser]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAuthed(false);
    setUser(null);
  };

  if (!authed) {
    return <AuthPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="app">
      <motion.header className="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="logo">
          <span className="logo-mark">CareerQuestAI</span>
          <span className="logo-sub">RAVi – XAI Compliance Dashboard</span>
        </div>
        <nav className="nav-tabs">
          {PAGES.map((p) => (
            <button
              key={p.id}
              className={`nav-tab ${page === p.id ? "active" : ""}`}
              onClick={() => setPage(p.id)}
            >
              <span className="nav-tab-icon">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </nav>
        <div className="nav-meta">
          {user && <span className="nav-date">{user.name} · {user.role}</span>}
          <button className="ghost" onClick={logout}>Sign out</button>
        </div>
      </motion.header>

      <main>
        <AnimatePresence mode="wait">
          {page === "dashboard" && <DashboardPage key="dashboard" />}
          {page === "score" && <ScorePage key="score" />}
          {page === "irr" && <IRRPage key="irr" />}
          {page === "profile" && <ProfilePage key="profile" user={user || {}} onLogout={logout} />}
        </AnimatePresence>
      </main>
    </div>
  );
}
