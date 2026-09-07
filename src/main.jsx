import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search, MapPin, Download, Bookmark, BookmarkCheck, ExternalLink,
  ChevronDown, ChevronLeft, ChevronRight, X, Clock3, CheckCircle2,
  Settings, LayoutDashboard, History, Menu, Linkedin, RefreshCw, RotateCcw,
  Trash2, AlertTriangle, Info, BookmarkPlus, Eye, Database, Plug, Building2, Briefcase,
  Bell, BellRing, LogIn, LogOut, Mail, Send, Plus, Power, Cloud, UserPlus, KeyRound, User, HelpCircle, ShieldCheck, Sparkles, FileText, ArrowLeft,
  BarChart3, LayoutGrid, List, Users, CalendarClock, Star, Gauge, Link2, Crown, Check, Zap,
  Moon, Sun, MessageSquarePlus, Home, TrendingUp, Target, Linkedin as LinkedinIcon,
  EyeOff, Ban, VolumeX, Sparkle, CalendarPlus, FileText as FileIcon, UserRound,
  Rocket, ArrowRight, Smartphone, MessageCircle, Phone
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase, supabaseEnabled, db, auth } from "./lib/supabase";
import { track, identify, captureError, installErrorHandlers, analyticsEnabled, errorsEnabled } from "./lib/telemetry";
import { PRIVACY, TERMS, LEGAL_CONFIG } from "./legal";
import "./styles.css";

/* ------------------------------------------------------------------ */
/* Demo data — only shown when no webhook is configured               */
/* ------------------------------------------------------------------ */
const DEMO_JOBS = [
  { id: "1", title: "AI Automation Engineer", company: "Airtable", location: "Remote · Worldwide", ageHours: 2, experience: "Mid-Senior", salary: "$110K – $150K", type: "Full-time", workplace: "Remote", easyApply: true, url: "https://www.linkedin.com/jobs/", description: "Design and ship internal automation across sales, support and finance using n8n, Python and LLM APIs. You'll own the roadmap for our automation platform and partner with ops teams to remove manual work.", skills: ["n8n", "Python", "LLM APIs", "Zapier", "SQL"] },
  { id: "2", title: "AI & Automation Engineer", company: "Notion", location: "Remote · Worldwide", ageHours: 24, experience: "Senior Level", salary: "$130K – $170K", type: "Full-time", workplace: "Remote", easyApply: true, url: "https://www.linkedin.com/jobs/", description: "Build agentic workflows that connect Notion to the rest of a company's stack. Strong TypeScript and API design experience required.", skills: ["TypeScript", "APIs", "Agents", "Postgres"] },
  { id: "3", title: "AI Automation Engineer", company: "HubSpot", location: "Remote · Americas", ageHours: 48, experience: "Mid-Senior", salary: "$105K – $140K", type: "Full-time", workplace: "Remote", easyApply: true, url: "https://www.linkedin.com/jobs/", description: "Automate CRM data hygiene and lead routing with AI. Experience with HubSpot workflows and one orchestration tool (n8n, Make, Zapier) is a plus.", skills: ["HubSpot", "n8n", "Python"] },
  { id: "4", title: "AI Automation Engineer", company: "Intercom", location: "Remote · EMEA", ageHours: 72, experience: "Mid-Level", salary: "$95K – $125K", type: "Full-time", workplace: "Remote", easyApply: true, url: "https://www.linkedin.com/jobs/", description: "Ship AI-driven support automations at scale.", skills: ["Node.js", "OpenAI", "Redis"] },
  { id: "5", title: "AI Workflow Engineer", company: "Monday.com", location: "Remote · EMEA", ageHours: 144, experience: "Mid-Level", salary: "$85K – $115K", type: "Full-time", workplace: "Hybrid", easyApply: true, url: "https://www.linkedin.com/jobs/", description: "Own workflow automation templates used by thousands of customers.", skills: ["JavaScript", "REST", "Workflow design"] },
  { id: "6", title: "Automation Developer", company: "Atlassian", location: "Remote · Americas", ageHours: 192, experience: "Mid-Senior", salary: "$105K – $145K", type: "Full-time", workplace: "Remote", easyApply: false, url: "https://www.linkedin.com/jobs/", description: "Extend Jira and Confluence automation rules with AI assistance.", skills: ["Java", "Forge", "Automation"] },
  { id: "7", title: "AI Integrations Engineer", company: "Postman", location: "Remote · Worldwide", ageHours: 216, experience: "Mid-Level", salary: "$95K – $130K", type: "Contract", workplace: "Remote", easyApply: true, url: "https://www.linkedin.com/jobs/", description: "Integrate LLM tooling into Postman's API platform.", skills: ["APIs", "Python", "LangChain"] }
];

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const DATE_FILTERS = [
  ["all", "Any time", Infinity], ["24h", "Past 24 hours", 24], ["3d", "Past 3 days", 72], ["7d", "Past 7 days", 168], ["30d", "Past 30 days", 720]
];
const PAGE_SIZES = [10, 25, 50];
const COUNTRIES = [
  ["", "Any country"], ["Nigeria", "Nigeria"], ["Ghana", "Ghana"], ["Kenya", "Kenya"], ["South Africa", "South Africa"], ["Egypt", "Egypt"],
  ["United States", "United States"], ["Canada", "Canada"], ["United Kingdom", "United Kingdom"], ["Ireland", "Ireland"],
  ["Germany", "Germany"], ["France", "France"], ["Netherlands", "Netherlands"], ["Spain", "Spain"], ["Portugal", "Portugal"], ["Italy", "Italy"],
  ["Switzerland", "Switzerland"], ["Sweden", "Sweden"], ["Poland", "Poland"], ["United Arab Emirates", "UAE"], ["Saudi Arabia", "Saudi Arabia"],
  ["India", "India"], ["Singapore", "Singapore"], ["Australia", "Australia"], ["Brazil", "Brazil"], ["Mexico", "Mexico"]
];
const SEARCH_TIMEOUT_MS = 180000; // Apify runs can take a couple of minutes
const STATUSES = [["saved", "Saved"], ["applied", "Applied"], ["interviewing", "Interviewing"], ["offer", "Offer"], ["rejected", "Rejected"]];
const TURNSTILE_KEY = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_TURNSTILE_SITE_KEY) || "";
const ENV = (k) => (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[k]) || "";
const PAYSTACK_KEY = ENV("VITE_PAYSTACK_PUBLIC_KEY"), PAYSTACK_PLAN = ENV("VITE_PAYSTACK_PLAN_CODE"), STRIPE_LINK = ENV("VITE_STRIPE_PAYMENT_LINK");
const PRO_NGN = Number(ENV("VITE_PRO_PRICE_NGN")) || 3000, PRO_USD = Number(ENV("VITE_PRO_PRICE_USD")) || 5;
const PLAN_FEATURES = {
  free: ["5 searches per day", "1 job alert", "Save jobs & track applications", "CSV export"],
  pro:  ["100 searches per day", "10 job alerts (daily or weekly)", "Company pages & salary filters", "Priority support", "Everything in Free"]
};
const POLL_MS = 2500, POLL_MAX_MS = 240000;
const ROLE_SUGGESTIONS = [
  "AI automation engineer", "Data analyst", "Software engineer", "Frontend developer", "Backend developer",
  "Product manager", "DevOps engineer", "Customer success manager", "Digital marketer", "Accountant",
  "Business analyst", "UI/UX designer", "Sales representative", "Project manager", "Virtual assistant"
];
const ONBOARD_COUNTRIES = ["Nigeria", "United States", "United Kingdom", "Canada", "Germany", "Netherlands", "United Arab Emirates", "South Africa", "Kenya", "Ghana", "Australia", "Ireland"];
const SHARE_KEYS = { query: "q", location: "loc", country: "country", dateRange: "date", workplace: "wp", experience: "exp", jobType: "jt", easyApply: "ea", underTenApplicants: "u10" };
const encodeShare = (p) => { const u = new URLSearchParams(); Object.entries(SHARE_KEYS).forEach(([k, sk]) => { const v = p[k]; if (v && v !== "all" && v !== "any" && v !== false) u.set(sk, String(v)); }); return `${window.location.origin}/?${u.toString()}`; };
const decodeShare = () => { const u = new URLSearchParams(window.location.search); if (!u.get("q")) return null; const p = {}; Object.entries(SHARE_KEYS).forEach(([k, sk]) => { const v = u.get(sk); if (v != null) p[k] = k === "underTenApplicants" ? v === "true" : v; }); return p; };
const APIFY_COST_PER_JOB = 0.005;
// wa.me opens WhatsApp on phone or desktop with the message already typed.
const waLink = (msg) => `https://wa.me/${LEGAL_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`; // USD estimate for the admin dashboard; adjust to your actor's price
const ENV_WEBHOOK = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_N8N_WEBHOOK_URL) || "";

/* ------------------------------------------------------------------ */
/* Storage — localStorage with a safe in-memory fallback               */
/* ------------------------------------------------------------------ */
const memoryStore = {};
const store = {
  get(key, fallback) {
    try { const v = window.localStorage?.getItem(key); return v != null ? JSON.parse(v) : (memoryStore[key] ?? fallback); }
    catch { return memoryStore[key] ?? fallback; }
  },
  set(key, value) {
    memoryStore[key] = value;
    try { window.localStorage?.setItem(key, JSON.stringify(value)); } catch { /* quota or unavailable */ }
  },
  remove(key) {
    delete memoryStore[key];
    try { window.localStorage?.removeItem(key); } catch { /* ignore */ }
  }
};
function usePersisted(key, fallback) {
  const [value, setValue] = useState(() => store.get(key, fallback));
  useEffect(() => { store.set(key, value); }, [key, value]);
  return [value, setValue];
}

/* ------------------------------------------------------------------ */
/* Job normalization — one shape no matter which Apify actor is used   */
/* ------------------------------------------------------------------ */
function toAgeHours(j) {
  if (j.ageHours != null && !isNaN(Number(j.ageHours))) return Number(j.ageHours);
  const src = j.postedAt || j.posted || j.datePosted || j.publishedAt || j.listedAt;
  if (!src) return 9999;
  if (typeof src === "number") return Math.max(0, (Date.now() - (src < 1e12 ? src * 1000 : src)) / 36e5);
  const s = String(src).toLowerCase();
  const num = parseFloat(s);
  if (!isNaN(num)) {
    if (s.includes("minute")) return num / 60;
    if (s.includes("hour")) return num;
    if (s.includes("day")) return num * 24;
    if (s.includes("week")) return num * 168;
    if (s.includes("month")) return num * 720;
  }
  if (s.includes("just now") || s.includes("today")) return 1;
  if (s.includes("yesterday")) return 24;
  const t = Date.parse(src);
  if (!isNaN(t)) return Math.max(0, (Date.now() - t) / 36e5);
  return 9999;
}
function relativeLabel(hours) {
  if (hours >= 9999) return "Recently";
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const d = Math.round(hours / 24);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.round(d / 7)}w ago`;
  return `${Math.round(d / 30)}mo ago`;
}
function toWorkplace(j) {
  const raw = String(j.workplace || j.workplaceType || j.workType || "").toLowerCase();
  if (raw.includes("remote")) return "Remote";
  if (raw.includes("hybrid")) return "Hybrid";
  if (raw.includes("on-site") || raw.includes("onsite") || raw.includes("on site")) return "On-site";
  if (j.remote === true) return "Remote";
  if (/remote/i.test(j.location || "")) return "Remote";
  return "Unknown";
}
function normalizeJob(j, i) {
  const ageHours = toAgeHours(j);
  const skills = Array.isArray(j.skills) ? j.skills : (typeof j.skills === "string" ? j.skills.split(",").map(s => s.trim()).filter(Boolean) : []);
  const url = j.url || j.jobUrl || j.link || j.applyUrl || "#";
  return {
    id: String(j.id || j.jobId || j.jobPostingId || url || i + 1),
    title: j.title || j.jobTitle || "Untitled job",
    company: j.company || j.companyName || "Unknown company",
    companyUrl: j.companyUrl || j.companyLinkedinUrl || "",
    location: j.location || j.jobLocation || "Not specified",
    ageHours: Math.round(ageHours * 10) / 10,
    posted: j.posted && typeof j.posted === "string" && !Date.parse(j.posted) ? j.posted : relativeLabel(ageHours),
    experience: j.experience || j.experienceLevel || j.seniorityLevel || "Not specified",
    salary: j.salary || j.salaryText || j.salaryRange || "Not disclosed",
    type: j.type || j.jobType || j.employmentType || "Full-time",
    workplace: toWorkplace(j),
    easyApply: Boolean(j.easyApply || j.applyType === "EASY_APPLY"),
    applicants: (() => { const n = parseInt(String(j.applicants ?? j.applicantsCount ?? "").replace(/[^0-9]/g, ""), 10); return isNaN(n) ? null : n; })(),
    salaryMin: Number(j.salaryMin) || parseSalary(j.salary || j.salaryText || "")[0],
    salaryMax: Number(j.salaryMax) || parseSalary(j.salary || j.salaryText || "")[1],
    industry: j.industry || j.companyIndustry || "",
    companySize: j.companySize || "",
    companyLogo: j.companyLogo || "",
    companyDescription: j.companyDescription || "",
    description: j.description || j.descriptionText || j.jobDescription || "",
    skills,
    url
  };
}
// "$110K – $150K", "CA$70,000.00/yr - CA$200,000.00/yr", "₦400k" → [min, max] as annual numbers (null if unknown)
function parseSalary(text) {
  const nums = [...String(text).matchAll(/(\d[\d,]*(?:\.\d+)?)\s*([kK])?/g)].map(m => Math.round(parseFloat(m[1].replace(/,/g, "")) * (m[2] ? 1000 : 1))).filter(n => n >= 1000);
  if (!nums.length) return [null, null];
  return [Math.min(...nums), Math.max(...nums)];
}
const fmtMoney = (n) => n == null ? "" : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
const jobKey = (j) => (j.url && j.url !== "#" ? j.url : j.id);
function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter(j => { const k = jobKey(j); if (seen.has(k)) return false; seen.add(k); return true; });
}
const companyInitial = (name) => name.slice(0, 1).toUpperCase();

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */
function buildCSV(items) {
  const headers = ["Title", "Company", "Location", "Workplace", "Posted", "Experience", "Salary", "Job Type", "Easy Apply", "Skills", "LinkedIn URL"];
  const rows = items.map(j => [j.title, j.company, j.location, j.workplace, j.posted, j.experience, j.salary, j.type, j.easyApply ? "Yes" : "No", (j.skills || []).join("; "), j.url]);
  return [headers, ...rows].map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}
function triggerDownload(csv, filename) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */
function App() {
  // search params
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [workplace, setWorkplace] = useState("any");
  const [experience, setExperience] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [easyApply, setEasyApply] = useState("all");
  const [underTen, setUnderTen] = useState(false);
  const [minSalary, setMinSalary] = useState(0);        // annual, in listing currency
  const [salaryOnly, setSalaryOnly] = useState(false);
  const [sort, setSort] = useState("recent");
  const [usage, setUsage] = useState(null);             // { used, limit, plan }
  const [savedView, setSavedView] = useState("list");
  const [savedQuery, setSavedQuery] = useState("");
  const [theme, setTheme] = usePersisted("jf:theme", "light");
  const [viewed, setViewed] = usePersisted("jf:viewed-jobs", {});   // jobKey -> ISO timestamp of the last time View Job was clicked
  const [applyPrompt, setApplyPrompt] = useState(null);             // job we just opened, asking whether they applied
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState({ kind: "Feature idea", text: "" });
  const [lastSeen, setLastSeen] = useState(null);                       // previous visit — powers the "New" badge
  const [localFilters, setLocalFilters] = usePersisted("jf:filters", []); // [{id, kind, value, label}]
  const [cloudFilters, setCloudFilters] = useState([]);
  const [filterDraft, setFilterDraft] = useState("");
  const [emailPrefs, setEmailPrefs] = useState({ weekly_summary: true, reminder_emails: true });   // list | board
  const [companyView, setCompanyView] = useState(null); // company name
  const [adminStats, setAdminStats] = useState(null);
  const [adminDays, setAdminDays] = useState(14);
  const [captchaToken, setCaptchaToken] = useState("");
  const [progress, setProgress] = useState(null);        // { stage, startedAt, searchId }
  const [jobPage, setJobPage] = useState(() => { const m = window.location.pathname.match(/^\/job\/([A-Za-z0-9_-]+)/); return m ? { id: m[1], job: null, loading: true } : (new URLSearchParams(window.location.search).get("job") ? { id: new URLSearchParams(window.location.search).get("job"), job: null, loading: true } : null); });
  const [upgradePrompt, setUpgradePrompt] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payments, setPayments] = useState([]);
  const sharedRef = useRef(decodeShare());
  const pollRef = useRef(null);
  const captchaRef = useRef(null);

  // settings (persisted)
  const [webhookOverride, setWebhookOverride] = usePersisted("jf:webhook", "");
  const [cacheMinutes, setCacheMinutes] = usePersisted("jf:cache-minutes", 30);
  const [pageSize, setPageSize] = usePersisted("jf:page-size", 10);
  const webhook = (webhookOverride || ENV_WEBHOOK || "").trim();
  const live = Boolean(webhook);

  // auth (Supabase) — optional; app works local-only without it
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin"); // signin | signup | forgot | reset
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [authStatus, setAuthStatus] = useState({ type: "", text: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [profileDraft, setProfileDraft] = useState("");
  const [pwDraft, setPwDraft] = useState({ password: "", confirm: "" });
  const [legalPage, setLegalPage] = useState(() => new URLSearchParams(window.location.search).get("page") || null); // privacy | terms
  const [agreed, setAgreed] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [onboard, setOnboard] = useState(null);      // { step, roles[], countries[], work, level }
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installDismissed, setInstallDismissed] = usePersisted("jf:install-dismissed", false);
  const cloud = supabaseEnabled && Boolean(user);

  // data — local (persisted in the browser) and cloud (Supabase) variants
  const [localSaved, setLocalSaved] = usePersisted("jf:saved-jobs", []);
  const [cloudSaved, setCloudSaved] = useState([]);
  const [localHistory, setLocalHistory] = usePersisted("jf:search-history", []);
  const [cloudHistory, setCloudHistory] = useState([]);
  const saved = cloud ? cloudSaved : localSaved;
  const setSaved = cloud ? setCloudSaved : setLocalSaved;
  const history = cloud ? cloudHistory : localHistory;
  const setHistory = cloud ? setCloudHistory : setLocalHistory;
  const [alerts, setAlerts] = useState([]);
  const [localSavedSearches, setLocalSavedSearches] = usePersisted("jf:saved-searches", []);
  const [cloudSavedSearches, setCloudSavedSearches] = useState([]);
  const savedSearches = cloud ? cloudSavedSearches : localSavedSearches;
  const [alertDraft, setAlertDraft] = useState(null);
  const [alertBusy, setAlertBusy] = useState(false);
  const [downloads, setDownloads] = usePersisted("jf:downloads", []);
  const [cache, setCache] = usePersisted("jf:cache", {});
  const [lastResults, setLastResults] = usePersisted("jf:last-results", null);

  // session state
  const [jobs, setJobs] = useState(() => (live ? (lastResults?.jobs || []) : DEMO_JOBS));
  const [resultMeta, setResultMeta] = useState(() => (live ? lastResults?.meta || null : { source: "demo" }));
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState("search"); // search | saved | history | downloads | settings
  const [page, setPage] = useState(1);
  const [detailJob, setDetailJob] = useState(null);
  const [webhookDraft, setWebhookDraft] = useState(webhookOverride);
  const abortRef = useRef(null);

  // ---- telemetry ----
  const telemetryCtx = useRef({ view: "search" });
  useEffect(() => { telemetryCtx.current.view = view; }, [view]);
  useEffect(() => {
    installErrorHandlers(() => telemetryCtx.current);
    track("app_opened", { theme, signed_in: Boolean(user) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (user) identify(user.id, { plan: profile?.plan || "free" }); }, [user, profile?.plan]);
  useEffect(() => { if (view) track("view_opened", { view }); }, [view]);

  // ---- installable app (PWA) ----
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => { setInstallPrompt(null); setNotice("Installed. Open it from your home screen any time."); });
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  // ---- theme ----
  useEffect(() => { document.documentElement.dataset.theme = theme; document.body.style.background = theme === "dark" ? "#12151b" : "#f8f9fd"; }, [theme]);

  // ---- "View Job" click tracking ----
  const openJob = (job, e) => {
    const key = jobKey(job);
    track("job_opened", { from: view, saved: isSaved(job) });
    setViewed(v => ({ ...v, [key]: new Date().toISOString() }));
    // If it's already in their tracker and still marked Saved, offer to move it to Applied.
    const sj = saved.find(x => jobKey(x) === key);
    if (sj && (sj.status || "saved") === "saved") setTimeout(() => setApplyPrompt(sj), 1200);
    // let the anchor's default behaviour open the tab
  };
  const viewedAgo = (job) => {
    const at = viewed[jobKey(job)];
    return at ? relativeLabel((Date.now() - Date.parse(at)) / 36e5) : null;
  };

  // ---- feedback ----
  const sendFeedback = () => {
    const body = encodeURIComponent(`${feedback.text}\n\n---\nFrom: ${displayName || "(not signed in)"}\nPage: ${view}\nApp: LinkedIn Job Finder`);
    const subject = encodeURIComponent(`[${feedback.kind}] LinkedIn Job Finder`);
    track("feedback_sent", { kind: feedback.kind });
    window.location.href = `mailto:${LEGAL_CONFIG.feedbackEmail}?subject=${subject}&body=${body}`;
    setFeedbackOpen(false); setFeedback({ kind: "Feature idea", text: "" });
    setNotice("Thanks — your email client should be opening. We read every message.");
  };

  // ---- shareable job page ----
  useEffect(() => {
    if (!jobPage?.id || jobPage.job) return;
    if (!supabaseEnabled) { setJobPage(p => ({ ...p, loading: false, missing: true })); return; }
    db.getJob(jobPage.id).then(j => setJobPage(p => ({ ...p, job: j, loading: false, missing: !j }))).catch(() => setJobPage(p => ({ ...p, loading: false, missing: true })));
  }, [jobPage?.id]);
  const closeJobPage = () => { setJobPage(null); window.history.replaceState({}, "", "/"); };
  const jobLink = (j) => `${window.location.origin}/job/${encodeURIComponent(j.id)}`;
  const copy = async (text, label = "Link") => { try { await navigator.clipboard.writeText(text); setNotice(`${label} copied.`); } catch { window.prompt("Copy this link:", text); } };

  // ---- Supabase session ----
  useEffect(() => {
    if (!supabaseEnabled) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === "PASSWORD_RECOVERY") { setAuthMode("reset"); setAuthOpen(true); setAuthStatus({ type: "", text: "Choose a new password." }); }
      if (event === "SIGNED_IN") { setAuthOpen(false); }
    });
    const q = new URLSearchParams(window.location.search);
    if (q.get("verified")) { setNotice("Email confirmed — you're signed in."); window.history.replaceState({}, "", window.location.pathname); }
    if (q.get("page") === "plans") setView("plans");
    if (q.get("upgraded")) { setNotice("Payment received — your Pro plan is being activated."); window.history.replaceState({}, "", window.location.pathname); }
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!cloud) { setProfile(null); return; }
    db.getProfile().then(p => {
      setProfile(p); setProfileDraft(p?.full_name || "");
      setEmailPrefs({ weekly_summary: p?.weekly_summary !== false, reminder_emails: p?.reminder_emails !== false });
      if (p && !p.onboarded_at) setOnboard({ step: 0, roles: [], countries: [], work: "any", level: "any" });
    }).catch(() => {});
  }, [cloud]);
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "";
  const isAdmin = Boolean(profile?.is_admin);
  const finishOnboarding = async (skip = false) => {
    const o = onboard;
    setOnboard(null);
    if (!cloud) return;
    try {
      const p = await db.saveOnboarding(user.id, skip ? {} : {
        target_roles: o.roles, target_countries: o.countries, work_pref: o.work, experience_level: o.level
      });
      setProfile(p);
    } catch (e) { /* onboarding is a nicety — never block the app on it */ }
    track("onboarding_finished", { skipped: skip, roles: o.roles.length, countries: o.countries.length, work: o.work, level: o.level });
    if (skip || !o.roles.length) { setTourStep(0); setTourOpen(true); return; }

    // Pre-fill and run their first search from what they told us.
    setQuery(o.roles[0]);
    setCountry(o.countries[0] || "");
    if (o.work !== "any") setWorkplace(o.work);
    if (o.level !== "any") setExperience(o.level);
    setView("search");
    setNotice(`Searching for "${o.roles[0]}"${o.countries[0] ? ` in ${o.countries[0]}` : ""} — your first results are on the way.`);
    setTimeout(() => runSearch({ query: o.roles[0], country: o.countries[0] || "", workplace: o.work, experience: o.level }), 300);
  };
  const toggleIn = (list, v, max) => list.includes(v) ? list.filter(x => x !== v) : (list.length >= max ? list : [...list, v]);

  const finishTour = () => {
    setTourOpen(false);
    if (cloud && profile && !profile.onboarded_at) db.updateProfile(user.id, { onboarded_at: new Date().toISOString() }).then(setProfile).catch(() => {});
  };
  // ---- load cloud data when signed in ----
  useEffect(() => {
    if (!cloud) { setCloudSaved([]); setCloudHistory([]); setAlerts([]); setCloudSavedSearches([]); setUsage(null); setCloudFilters([]); return; }
    (async () => {
      try {
        const [s, h, a, ss, u, f, prev] = await Promise.all([
          db.listSaved(), db.listSearches(20), db.listAlerts(), db.listSavedSearches(), db.usageToday(),
          db.listFilters().catch(() => []), db.touchLastSeen().catch(() => null)
        ]);
        setCloudSaved(s); setCloudHistory(h); setAlerts(a); setCloudSavedSearches(ss); setUsage(u);
        setCloudFilters(f || []); setLastSeen(prev ? Date.parse(prev) : null);
      } catch (e) { setError(`Couldn't load your account data: ${e.message}`); }
    })();
  }, [cloud]);

  const openAuth = (mode = "signin") => { setAuthMode(mode); setAuthStatus({ type: "", text: "" }); setAuthOpen(true); };
  const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  const submitAuth = async () => {
    const f = { ...authForm, email: authForm.email.trim(), name: authForm.name.trim() };
    const fail = (text) => setAuthStatus({ type: "error", text });
    if (authMode !== "reset" && !validEmail(f.email)) return fail("Enter a valid email address.");
    if ((authMode === "signup" || authMode === "reset") && f.password.length < 8) return fail("Password must be at least 8 characters.");
    if ((authMode === "signup" || authMode === "reset") && f.password !== f.confirm) return fail("Passwords don't match.");
    if (authMode === "signup" && f.name.length < 2) return fail("Enter your full name.");
    if (authMode === "signup" && !agreed) return fail("Please accept the Terms of Service and Privacy Policy.");
    if (authMode === "signin" && !f.password) return fail("Enter your password.");
    setAuthBusy(true); setAuthStatus({ type: "", text: "" });
    try {
      if (authMode === "signup") {
        if (TURNSTILE_KEY && !captchaToken) return fail("Please complete the captcha.");
        const { data, error: e } = await auth.signUp(f.email, f.password, f.name, captchaToken);
        if (e) throw e;
        if (data.session) { setAuthOpen(false); setNotice(`Welcome, ${f.name}! Your account is ready.`); }
        else setAuthStatus({ type: "ok", text: `Account created. We sent a confirmation link to ${f.email} — click it to finish signing up.` });
        track("signed_up");
      } else if (authMode === "signin") {
        const { error: e } = await auth.signIn(f.email, f.password, captchaToken);
        if (e) throw e;
        setAuthOpen(false); setNotice("Signed in. Your saved jobs and alerts are synced."); track("signed_in");
      } else if (authMode === "forgot") {
        const { error: e } = await auth.resetPassword(f.email);
        if (e) throw e;
        setAuthStatus({ type: "ok", text: `Password reset link sent to ${f.email}.` });
      } else if (authMode === "reset") {
        const { error: e } = await auth.updatePassword(f.password);
        if (e) throw e;
        setAuthOpen(false); setNotice("Password updated. You're signed in.");
        window.history.replaceState({}, "", window.location.pathname);
      }
      setAuthForm(a => ({ ...a, password: "", confirm: "" }));
    } catch (e) {
      const msg = /confirmed/i.test(e.message) ? "Please confirm your email first — check your inbox (and spam)." : /invalid login/i.test(e.message) ? "Wrong email or password." : /already registered/i.test(e.message) ? "That email already has an account — sign in instead." : e.message;
      fail(msg);
    } finally { setAuthBusy(false); }
  };
  const resendConfirmation = async () => {
    const { error: e } = await auth.resendConfirmation(authForm.email.trim());
    setAuthStatus(e ? { type: "error", text: e.message } : { type: "ok", text: "Confirmation email re-sent." });
  };
  const signOut = async () => { await auth.signOut(); setView("search"); setNotice("Signed out. You're back in local mode."); };
  const saveProfile = async () => {
    try { const p = await db.updateProfile(user.id, { full_name: profileDraft.trim(), email: user.email }); setProfile(p); setNotice("Profile updated."); }
    catch (e) { setError(`Couldn't update profile: ${e.message}`); }
  };
  const deleteAccount = async () => {
    const typed = window.prompt("This permanently deletes your account, saved jobs and alerts. Type DELETE to confirm.");
    if (typed !== "DELETE") return;
    const { error: e } = await auth.deleteAccount();
    if (e) { setError(`Couldn't delete account: ${e.message}`); return; }
    await auth.signOut(); setNotice("Your account has been deleted.");
  };
  const changePassword = async () => {
    if (pwDraft.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (pwDraft.password !== pwDraft.confirm) { setError("Passwords don't match."); return; }
    const { error: e } = await auth.updatePassword(pwDraft.password);
    if (e) setError(e.message); else { setPwDraft({ password: "", confirm: "" }); setNotice("Password changed."); }
  };

  const savedKeys = useMemo(() => new Set(saved.map(jobKey)), [saved]);
  const isSaved = (j) => savedKeys.has(jobKey(j));

  // when switching from demo to live (or back) reset the working set
  useEffect(() => {
    if (live && resultMeta?.source === "demo") { setJobs(lastResults?.jobs || []); setResultMeta(lastResults?.meta || null); }
    if (!live && resultMeta?.source !== "demo") { setJobs(DEMO_JOBS); setResultMeta({ source: "demo" }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  /* ---------------- filtering / sorting ---------------- */
  /* ---------------- noise controls ---------------- */
  const filters = cloud ? cloudFilters : localFilters;
  const hiddenJobs   = useMemo(() => new Set(filters.filter(f => f.kind === "hidden_job").map(f => f.value)), [filters]);
  const blockedCos   = useMemo(() => new Set(filters.filter(f => f.kind === "blocked_company").map(f => f.value.toLowerCase())), [filters]);
  const mutedWords   = useMemo(() => filters.filter(f => f.kind === "muted_keyword").map(f => f.value.toLowerCase()), [filters]);


  // "New since your last visit" — anything first seen after the previous session.
  const isNew = (job) => {
    if (!lastSeen || !job.ageHours) return false;
    return Date.now() - job.ageHours * 36e5 > lastSeen;
  };


  const basePool = view === "saved" ? saved : jobs;
  const filteredJobs = useMemo(() => {
    const isSaved = view === "saved";
    // Saved Jobs has its own filter box — never inherit the keyword/location from the search page,
    // because those inputs aren't visible here and would silently hide saved jobs.
    const q = (isSaved ? savedQuery : query).trim().toLowerCase();
    const loc = isSaved ? "" : location.trim().toLowerCase();
    const maxHours = DATE_FILTERS.find(([k]) => k === dateRange)?.[2] ?? Infinity;
    // In live mode the backend already applied keyword + location; only refine on the client in demo/saved views.
    const refineText = !live || isSaved;
    let result = basePool.filter(job => {
      if (!isSaved) {
        // Noise controls only apply to search results — never hide something the user deliberately saved.
        if (hiddenJobs.has(jobKey(job))) return false;
        if (blockedCos.has(job.company.toLowerCase())) return false;
        if (mutedWords.some(w => job.title.toLowerCase().includes(w))) return false;
      }
      if (refineText && q && !`${job.title} ${job.company} ${job.location} ${(job.skills || []).join(" ")}`.toLowerCase().includes(q)) return false;
      if (refineText && loc && loc !== "remote" && !job.location.toLowerCase().includes(loc)) return false;
      if (job.ageHours > maxHours) return false;
      if (workplace !== "any" && job.workplace !== "Unknown" && job.workplace.toLowerCase() !== workplace) return false;
      if (experience !== "all" && !job.experience.toLowerCase().includes(experience)) return false;
      if (jobType !== "all" && !job.type.toLowerCase().includes(jobType)) return false;
      if (easyApply !== "all" && (easyApply === "yes" ? !job.easyApply : job.easyApply)) return false;
      if (underTen && job.applicants != null && job.applicants >= 10) return false;
      if (salaryOnly && !job.salaryMin && !job.salaryMax) return false;
      if (minSalary > 0 && (job.salaryMax || job.salaryMin) && Math.max(job.salaryMax || 0, job.salaryMin || 0) < minSalary) return false;
      return true;
    });
    const salaryNum = (s) => Number((String(s).match(/\d+/) || [0])[0]);
    if (sort === "recent") result = [...result].sort((a, b) => a.ageHours - b.ageHours);
    if (sort === "company") result = [...result].sort((a, b) => a.company.localeCompare(b.company));
    if (sort === "salary") result = [...result].sort((a, b) => salaryNum(b.salary) - salaryNum(a.salary));
    if (sort === "title") result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [basePool, live, view, query, savedQuery, location, dateRange, workplace, experience, jobType, easyApply, underTen, salaryOnly, minSalary, sort, hiddenJobs, blockedCos, mutedWords]);

  useEffect(() => setPage(1), [query, savedQuery, location, country, dateRange, workplace, experience, jobType, easyApply, underTen, salaryOnly, minSalary, view, pageSize, jobs]);
  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedJobs = filteredJobs.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ---------------- selection / saving ---------------- */
  const selectedKeys = useMemo(() => new Set(selected), [selected]);
  const toggleSelected = (j) => setSelected(s => s.includes(jobKey(j)) ? s.filter(x => x !== jobKey(j)) : [...s, jobKey(j)]);
  const allOnPageSelected = pagedJobs.length > 0 && pagedJobs.every(j => selectedKeys.has(jobKey(j)));
  const toggleAll = () => {
    const keys = pagedJobs.map(jobKey);
    setSelected(s => allOnPageSelected ? s.filter(k => !keys.includes(k)) : [...new Set([...s, ...keys])]);
  };
  const selectedJobs = filteredJobs.filter(j => selectedKeys.has(jobKey(j)));
  const persistSave = (job, add) => {
    if (!cloud) return;
    (add ? db.saveJob(user.id, job, jobKey(job)) : db.unsaveJob(jobKey(job))).catch(e => setError(`Couldn't sync saved job: ${e.message}`));
  };
  const toggleSaved = (job) => {
    const add = !isSaved(job);
    track(add ? "job_saved" : "job_unsaved", { from: view });
    setSaved(s => add ? [{ ...job, savedAt: new Date().toISOString() }, ...s] : s.filter(x => jobKey(x) !== jobKey(job)));
    persistSave(job, add);
  };
  const saveSelected = () => {
    const fresh = selectedJobs.filter(j => !isSaved(j)).map(j => ({ ...j, savedAt: new Date().toISOString() }));
    setSaved(s => [...fresh, ...s]);
    fresh.forEach(j => persistSave(j, true));
    setNotice(`${fresh.length} job${fresh.length === 1 ? "" : "s"} saved${cloud ? " to your account" : ""}.`);
  };

  /* ---------------- CSV export ---------------- */
  // Turn the current search into a filename slug: "ai automation" + Nigeria + 7d → "ai-automation-nigeria-7d"
  const searchSlug = () => {
    const p = currentParams();
    const bits = [p.query, p.country || p.location, p.workplace !== "any" ? p.workplace : "", p.dateRange !== "all" ? p.dateRange : ""];
    const slug = bits.filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    return slug || "search";
  };

  const downloadCSV = (items, label) => {
    if (!items.length) { setNotice("No jobs to export — adjust your filters first."); return; }
    const csv = buildCSV(items);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${label || searchSlug()}-${stamp}.csv`;
    triggerDownload(csv, filename);
    track("csv_exported", { count: items.length, view });
    setNotice(`${items.length} job${items.length === 1 ? "" : "s"} exported to ${filename}.`);
    // keep the rows with the log so it can be re-downloaded later (cap the log at 10 entries)
    setDownloads(d => [{ filename, label: label || `${currentParams().query || "All jobs"}${currentParams().country ? " · " + currentParams().country : ""}`, count: items.length, at: new Date().toISOString(), items }, ...d].slice(0, 10));
  };
  const redownload = (entry) => { triggerDownload(buildCSV(entry.items || []), entry.filename); setNotice(`Re-downloaded ${entry.filename}.`); };

  /* ---------------- search ---------------- */
  const pushHistory = (params, resultCount = null) => {
    setHistory(h => [{ ...params, resultCount, at: new Date().toISOString() }, ...h.filter(x => JSON.stringify([x.query, x.location, x.country, x.dateRange, x.workplace]) !== JSON.stringify([params.query, params.location, params.country, params.dateRange, params.workplace]))].slice(0, 20));
    if (cloud) db.logSearch(user.id, params, resultCount).catch(() => {});
  };

  const runSearch = async (overrides = {}, { force = false } = {}) => {
    const params = { query: query.trim(), location: location.trim(), country, dateRange, workplace, experience, jobType, easyApply, underTenApplicants: underTen, ...overrides };
    setView("search"); setError(""); setNotice(""); setSelected([]);
    if (!params.query) { setError("Enter a job title or keyword to search."); return; }
    // Which filters people actually use. The keyword itself is never sent — only whether one was set.
    track("search_started", {
      has_country: Boolean(params.country), country: params.country || "none",
      has_location: Boolean(params.location), date_range: params.dateRange,
      workplace: params.workplace, experience: params.experience, job_type: params.jobType,
      easy_apply: params.easyApply, under_ten: params.underTenApplicants,
      query_words: params.query.split(/\s+/).length, source: overrides.__source || "manual"
    });

    if (!live) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 500));
      setJobs(DEMO_JOBS); setResultMeta({ source: "demo" });
      setLoading(false);
      setNotice("Demo results — go to Settings and add your n8n webhook to search live LinkedIn listings.");
      pushHistory(params);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    const finish = (normalized, meta, note) => {
      setJobs(normalized); setResultMeta(meta); setLastResults({ jobs: normalized, meta }); setSelected([]);
      setNotice(note); pushHistory(params, normalized.length);
      if (cloud) db.usageToday().then(setUsage).catch(() => {});
    };
    try {
      const headers = { "Content-Type": "application/json" };
      if (cloud) headers.Authorization = `Bearer ${await auth.getAccessToken()}`;
      setProgress({ stage: "Starting search…", startedAt: Date.now() });
      const response = await fetch(webhook, { method: "POST", headers, body: JSON.stringify({ source: "linkedin", ...params }), signal: controller.signal });
      const data = await response.json().catch(() => null);

      if (response.status === 401) { setError(data?.error || "Your session has expired — please sign in again."); if (cloud) await auth.signOut(); return; }
      if (response.status === 429) { setError(data?.error || "Daily search limit reached. Try again tomorrow."); setUpgradePrompt("searches"); track("quota_hit", { plan: profile?.plan || "free" }); if (cloud) db.usageToday().then(setUsage).catch(() => {}); return; }
      if (!response.ok || data?.error) throw new Error(data?.error || `Server responded with ${response.status}`);
      if (!data?.searchId) throw new Error("The server didn't start a search run");

      // The API responds immediately; the worker scrapes in the background and writes to search_runs.
      clearTimeout(timer);
      const started = Date.now();
      setProgress({ stage: "Searching LinkedIn…", startedAt: started, searchId: data.searchId });
      const run = await new Promise((resolve, reject) => {
        const tick = async () => {
          if (controller.signal.aborted) return reject(Object.assign(new Error("cancelled"), { name: "AbortError" }));
          if (Date.now() - started > POLL_MAX_MS) return reject(new Error("timed out"));
          try {
            const r = await db.getSearchRun(data.searchId);
            if (r?.status === "done") return resolve(r);
            if (r?.status === "failed") return reject(new Error(r.error || "The scrape failed"));
            if (r?.stage) setProgress(p => ({ ...p, stage: r.stage }));
          } catch { /* transient — keep polling */ }
          pollRef.current = setTimeout(tick, POLL_MS);
        };
        tick();
      });

      const normalized = dedupe((run.results || []).map(normalizeJob));
      const meta = { source: "live", at: Date.now(), count: normalized.length, params };
      setJobs(normalized); setResultMeta(meta); setLastResults({ jobs: normalized, meta }); setSelected([]);
      setNotice(normalized.length
        ? `${normalized.length} LinkedIn job${normalized.length === 1 ? "" : "s"} found.`
        : "The search ran but returned no listings. Try a broader keyword or a wider date range.");
      pushHistory(params, normalized.length);
      track("search_completed", { results: normalized.length, seconds: Math.round((Date.now() - started) / 1000), zero_results: normalized.length === 0 });
      if (cloud) db.usageToday().then(setUsage).catch(() => {});
    } catch (e) {
      track("search_failed", { reason: e.name === "AbortError" ? "cancelled" : /timed out/.test(e.message) ? "timeout" : "error" });
      if (e.name !== "AbortError") captureError(e, { ...telemetryCtx.current, stage: "search" });
      if (e.name === "AbortError") setError("Search cancelled.");
      else if (/timed out/.test(e.message)) setError("LinkedIn is taking longer than usual. Try the search again in a minute.");
      else setError(`Couldn't complete the search (${e.message}). Previous results are still shown below.`);
    } finally {
      clearTimeout(timer); clearTimeout(pollRef.current);
      abortRef.current = null; setLoading(false); setProgress(null);
    }
  };
  const cancelSearch = () => abortRef.current?.abort();
  const refreshSearch = () => runSearch(resultMeta?.params || {}, { force: true });

  useEffect(() => {
    const p = sharedRef.current; if (!p) return;
    if (supabaseEnabled && !user) return;            // wait for sign-in; the URL survives
    sharedRef.current = null; window.history.replaceState({}, "", "/");
    rerun({ ...p });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const copySearchLink = (p = currentParams()) => copy(encodeShare(p), "Search link");

  const rerun = (entry) => {
    setQuery(entry.query || ""); setLocation(entry.location || ""); setCountry(entry.country || ""); setDateRange(entry.dateRange || "all");
    setWorkplace(entry.workplace || "any"); setExperience(entry.experience || "all"); setJobType(entry.jobType || "all"); setEasyApply(entry.easyApply || "all"); setUnderTen(Boolean(entry.underTenApplicants));
    runSearch(entry);
  };
  const resetFilters = () => { setSavedQuery(""); setUnderTen(false); setMinSalary(0); setSalaryOnly(false); setCountry(""); setDateRange("all"); setWorkplace("any"); setExperience("all"); setJobType("all"); setEasyApply("all"); setSort("recent"); };
  const activeFilterCount = [underTen, minSalary > 0, salaryOnly, country !== "", dateRange !== "all", workplace !== "any", experience !== "all", jobType !== "all", easyApply !== "all"].filter(Boolean).length;

  /* ---------------- noise control actions ---------------- */
  const addFilter = async (kind, value, label) => {
    if (!value) return;
    if (cloud) {
      try { const row = await db.addFilter(user.id, kind, value, label); setCloudFilters(f => [row, ...f.filter(x => !(x.kind === kind && x.value === value))]); }
      catch (e) { setError(`Couldn't save that: ${e.message}`); return; }
    } else {
      setLocalFilters(f => [{ id: `${kind}:${value}`, kind, value, label }, ...f.filter(x => !(x.kind === kind && x.value === value))]);
    }
    track("filter_added", { kind });
    setNotice(kind === "hidden_job" ? "Job hidden. Undo it under Settings → Hidden & blocked."
      : kind === "blocked_company" ? `${label || value} blocked — their jobs won't show again.`
      : `"${value}" muted — jobs with that word are hidden.`);
  };
  const removeFilter = async (row) => {
    if (cloud) { try { await db.removeFilter(row.id); setCloudFilters(f => f.filter(x => x.id !== row.id)); } catch (e) { setError(e.message); } }
    else setLocalFilters(f => f.filter(x => x.id !== row.id));
  };

  /* ---------------- application tracker ---------------- */
  const updateTracker = (job, patch) => {
    setSaved(s => s.map(x => jobKey(x) === jobKey(job) ? { ...x, ...patch } : x));
    if (detailJob && jobKey(detailJob) === jobKey(job)) setDetailJob(d => ({ ...d, ...patch }));
    if (cloud) db.updateSaved(jobKey(job), {
      status: patch.status, notes: patch.notes, applied_at: patch.appliedAt, follow_up_at: patch.followUpAt,
      cv_version: patch.cvVersion, recruiter_name: patch.recruiterName, recruiter_email: patch.recruiterEmail,
      interview_at: patch.interviewAt, interview_note: patch.interviewNote,
      reminder_sent_at: null,   // details changed — let the reminder fire again
      updated_at: new Date().toISOString()
    }).catch(e => setError(`Couldn't save: ${e.message}`));
  };
  const trackerPatch = (j, over) => ({ status: j.status, notes: j.notes, appliedAt: j.appliedAt, followUpAt: j.followUpAt, cvVersion: j.cvVersion, recruiterName: j.recruiterName, recruiterEmail: j.recruiterEmail, interviewAt: j.interviewAt, interviewNote: j.interviewNote, ...over });
  const setStatus = (job, status) => (track("status_changed", { to: status }), updateTracker(job, trackerPatch(job, {
    status,
    appliedAt: status === "applied" && !job.appliedAt ? new Date().toISOString().slice(0, 10) : job.appliedAt,
    // Moving to Interviewing? Nudge a follow-up a week out if they haven't set one.
    followUpAt: status === "interviewing" && !job.followUpAt ? new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) : job.followUpAt
  })));

  // Download a .ics so the interview lands in whatever calendar they use.
  const addToCalendar = (j) => {
    if (!j.interviewAt) return;
    const start = new Date(j.interviewAt);
    const end = new Date(start.getTime() + 60 * 60000);
    const fmt = d => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const esc = t => String(t || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LinkedIn Job Finder//EN", "BEGIN:VEVENT",
      `UID:${jobKey(j)}@jobfinder`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:${esc(`Interview — ${j.title} at ${j.company}`)}`,
      `DESCRIPTION:${esc([j.interviewNote, j.recruiterName && `Recruiter: ${j.recruiterName}`, j.url].filter(Boolean).join("\n"))}`,
      `LOCATION:${esc(j.interviewNote || j.location || "")}`,
      "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:Interview in 1 hour", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a"); a.href = url; a.download = `interview-${j.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
    setNotice("Calendar invite downloaded — open it to add the interview.");
  };
  const upcomingInterviews = saved.filter(j => j.interviewAt && new Date(j.interviewAt) >= new Date()).sort((a, b) => new Date(a.interviewAt) - new Date(b.interviewAt));
  const today = new Date().toISOString().slice(0, 10);
  const followUpsDue = saved.filter(j => j.followUpAt && j.followUpAt <= today && !["offer", "rejected"].includes(j.status || "saved"));

  /* ---------------- dashboard ---------------- */
  const pipeline = useMemo(() => {
    const by = k => saved.filter(j => (j.status || "saved") === k);
    const applied = saved.filter(j => ["applied", "interviewing", "offer", "rejected"].includes(j.status));
    const week = (d) => { const t = new Date(); t.setDate(t.getDate() - d); return t.toISOString().slice(0, 10); };
    const appliedSince = (days) => applied.filter(j => j.appliedAt && j.appliedAt >= week(days)).length;
    const last8Weeks = Array.from({ length: 8 }, (_, i) => {
      const end = week(i * 7), start = week((i + 1) * 7);
      return { label: i === 0 ? "This wk" : `${i}w ago`, count: applied.filter(j => j.appliedAt && j.appliedAt > start && j.appliedAt <= end).length };
    }).reverse();
    const responded = saved.filter(j => ["interviewing", "offer"].includes(j.status)).length;
    return {
      saved: by("saved").length, applied: by("applied").length, interviewing: by("interviewing").length,
      offer: by("offer").length, rejected: by("rejected").length,
      totalApplied: applied.length, thisWeek: appliedSince(7), lastMonth: appliedSince(30),
      responseRate: applied.length ? Math.round((responded / applied.length) * 100) : 0,
      viewedCount: Object.keys(viewed).length,
      last8Weeks,
      recent: [...saved].sort((a, b) => String(b.appliedAt || b.savedAt || "").localeCompare(String(a.appliedAt || a.savedAt || ""))).slice(0, 6)
    };
  }, [saved, viewed]);

  /* ---------------- saved searches ---------------- */
  const saveCurrentSearch = async () => {
    const p = currentParams();
    if (!p.query) { setError("Type a keyword first."); return; }
    const name = window.prompt("Name this search:", [p.query, p.country || p.location].filter(Boolean).join(" · "));
    if (!name) return;
    if (cloud) { try { const row = await db.createSavedSearch(user.id, name, p); setCloudSavedSearches(x => [row, ...x]); } catch (e) { setError(e.message); return; } }
    else setLocalSavedSearches(x => [{ id: String(Date.now()), name, params: p, created_at: new Date().toISOString() }, ...x]);
    setNotice(`Saved search "${name}". Find it under Search History.`);
  };
  const deleteSavedSearch = async (row) => {
    if (cloud) { try { await db.deleteSavedSearch(row.id); setCloudSavedSearches(x => x.filter(r => r.id !== row.id)); } catch (e) { setError(e.message); } }
    else setLocalSavedSearches(x => x.filter(r => r.id !== row.id));
  };

  /* ---------------- admin ---------------- */
  useEffect(() => {
    if (view !== "admin" || !isAdmin) return;
    db.adminStats(adminDays).then(setAdminStats).catch(e => setError(`Admin stats: ${e.message}`));
  }, [view, isAdmin, adminDays]);

  /* ---------------- captcha (Cloudflare Turnstile) ---------------- */
  useEffect(() => {
    if (!TURNSTILE_KEY || !authOpen && !(supabaseEnabled && !user)) return;
    if (!document.getElementById("cf-turnstile")) {
      const sc = document.createElement("script"); sc.id = "cf-turnstile"; sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; sc.async = true; document.head.appendChild(sc);
    }
    const t = setInterval(() => {
      if (window.turnstile && captchaRef.current && !captchaRef.current.dataset.rendered) {
        captchaRef.current.dataset.rendered = "1";
        window.turnstile.render(captchaRef.current, { sitekey: TURNSTILE_KEY, callback: setCaptchaToken, "expired-callback": () => setCaptchaToken("") });
        clearInterval(t);
      }
    }, 300);
    return () => clearInterval(t);
  }, [authOpen, authMode, user]);

  /* ---------------- job alerts ---------------- */
  const currentParams = () => ({ query: query.trim(), location: location.trim(), country, dateRange, workplace, experience, jobType, easyApply, underTenApplicants: underTen });
  const startAlert = () => {
    if (!supabaseEnabled) { setError("Job alerts need Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env."); return; }
    if (!user) { openAuth("signin"); setAuthStatus({ type: "", text: "Sign in or create an account to set up job alerts." }); return; }
    const p = currentParams();
    setAlertDraft({ name: [p.query || "All jobs", p.country || p.location || "Anywhere"].join(" · "), params: p, frequency: "daily", channel: "email", email: user.email || "", telegram_chat_id: "" });
    setView("alerts");
  };
  const submitAlert = async () => {
    if (!alertDraft.name.trim()) { setError("Give the alert a name."); return; }
    if (!alertDraft.params.query) { setError("An alert needs a keyword to search for."); return; }
    if (alertDraft.channel === "email" && !alertDraft.email.trim()) { setError("Enter the email address to send alerts to."); return; }
    if (alertDraft.channel === "telegram" && !alertDraft.telegram_chat_id.trim()) { setError("Enter your Telegram chat ID."); return; }
    setAlertBusy(true); setError("");
    try {
      const row = await db.createAlert(user.id, { ...alertDraft, name: alertDraft.name.trim(), params: { ...alertDraft.params, dateRange: alertDraft.params.dateRange === "all" ? "7d" : alertDraft.params.dateRange } });
      setAlerts(a => [row, ...a]); setAlertDraft(null);
      track("alert_created", { frequency: row.frequency, channel: row.channel, has_country: Boolean(row.params.country) });
      setNotice(`Alert "${row.name}" created. n8n will run it ${row.frequency} and send only new postings.`);
    } catch (e) { if (/limit reached/i.test(e.message)) { setError(e.message.replace(/^.*?Alert/, "Alert")); setUpgradePrompt("alerts"); } else setError(`Couldn't create alert: ${e.message}`); }
    finally { setAlertBusy(false); }
  };
  const toggleAlert = async (alert) => {
    try { const row = await db.updateAlert(alert.id, { active: !alert.active }); setAlerts(a => a.map(x => x.id === row.id ? row : x)); }
    catch (e) { setError(`Couldn't update alert: ${e.message}`); }
  };
  const removeAlert = async (alert) => {
    if (!window.confirm(`Delete alert "${alert.name}"?`)) return;
    try { await db.deleteAlert(alert.id); setAlerts(a => a.filter(x => x.id !== alert.id)); }
    catch (e) { setError(`Couldn't delete alert: ${e.message}`); }
  };

  /* ---------------- plans & payments ---------------- */
  const isPro = profile?.plan === "pro";
  useEffect(() => { if (view === "plans" && cloud) db.listPayments().then(setPayments).catch(() => {}); }, [view, cloud]);
  const refreshProfileUntilPro = async () => {
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try { const p = await db.getProfile(); setProfile(p); if (p?.plan === "pro") { setNotice("You're on Pro. Limits updated."); setUpgradePrompt(""); return; } } catch { /* retry */ }
    }
    setNotice("Payment received. Pro activates as soon as the payment provider confirms — usually within a minute.");
  };
  const payWithPaystack = () => {
    if (!PAYSTACK_KEY) { setError("Paystack isn't configured yet (VITE_PAYSTACK_PUBLIC_KEY)."); return; }
    const start = () => {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY, email: user.email, plan: PAYSTACK_PLAN || undefined, amount: PAYSTACK_PLAN ? undefined : PRO_NGN * 100, currency: "NGN",
        metadata: { user_id: user.id, custom_fields: [{ display_name: "Plan", variable_name: "plan", value: "pro" }] },
        callback: () => { setPayBusy(true); setNotice("Payment received — activating Pro…"); refreshProfileUntilPro().finally(() => setPayBusy(false)); },
        onClose: () => setPayBusy(false)
      });
      handler.openIframe();
    };
    setPayBusy(true);
    if (window.PaystackPop) return start();
    const sc = document.createElement("script"); sc.src = "https://js.paystack.co/v1/inline.js"; sc.onload = start; sc.onerror = () => { setPayBusy(false); setError("Couldn't load Paystack. Check your connection."); }; document.head.appendChild(sc);
  };
  const payWithStripe = () => {
    if (!STRIPE_LINK) { setError("Card payments aren't configured yet (VITE_STRIPE_PAYMENT_LINK)."); return; }
    const u = new URL(STRIPE_LINK); u.searchParams.set("client_reference_id", user.id); u.searchParams.set("prefilled_email", user.email);
    window.open(u.toString(), "_blank", "noopener");
    setNotice("Complete the payment in the new tab. Pro activates automatically when Stripe confirms."); refreshProfileUntilPro();
  };

  /* ---------------- settings actions ---------------- */
  const saveWebhook = () => {
    const v = webhookDraft.trim();
    if (v && !/^https?:\/\//i.test(v)) { setError("Webhook URL must start with http:// or https://"); return; }
    setWebhookOverride(v); setError(""); setNotice(v ? "Webhook saved. Searches now run through n8n." : "Webhook cleared — back to demo mode.");
  };
  const clearCache = () => { setCache({}); setNotice("Result cache cleared."); };
  const clearAllData = () => {
    if (!window.confirm(`Clear ${cloud ? "local " : ""}saved jobs, search history, downloads and cache? This can't be undone.`)) return;
    setLocalSaved([]); setLocalHistory([]); setDownloads([]); setCache({}); setLastResults(null);
    if (live) { setJobs([]); setResultMeta(null); }
    setNotice("All local data cleared.");
  };

  // close drawer on Esc
  useEffect(() => {
    if (!detailJob) return;
    const onKey = (e) => e.key === "Escape" && setDetailJob(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailJob]);

  const authCard = (
    <>
    <div className="modal-head">
      <div className="brand-icon">{authMode === "signup" ? <UserPlus size={18} /> : authMode === "signin" ? <LogIn size={18} /> : <KeyRound size={18} />}</div>
      <div>
        <h2>{{ signin: "Welcome back", signup: "Create your account", forgot: "Reset your password", reset: "Set a new password" }[authMode]}</h2>
        <p className="panel-sub" style={{ margin: 0 }}>{{ signin: "Sign in to sync saved jobs and manage alerts.", signup: "Free account — save jobs across devices and get new postings by email.", forgot: "We'll email you a link to choose a new password.", reset: "Minimum 8 characters." }[authMode]}</p>
      </div>
      {authOpen && authMode !== "reset" && <button className="icon-btn" onClick={() => setAuthOpen(false)} aria-label="Close"><X size={18} /></button>}
    </div>
    <div className="auth-fields">
      {authMode === "signup" && <label>Full name<input value={authForm.name} onChange={e => setAuthForm(a => ({ ...a, name: e.target.value }))} autoComplete="name" autoFocus /></label>}
      {authMode === "signup" && <label>Phone number
        <input type="tel" value={authForm.phone} placeholder="0812 002 6492" autoComplete="tel"
          onChange={e => setAuthForm(a => ({ ...a, phone: e.target.value }))} />
        {authForm.phone && !validPhone(authForm.phone) && <small className="field-hint warn">That doesn't look like a valid number yet.</small>}
        {validPhone(authForm.phone) && <small className="field-hint ok"><Check size={11} /> {normalizePhone(authForm.phone)}</small>}
      </label>}
      {authMode === "signup" && <label className="consent tight">
        <input type="checkbox" checked={authForm.whatsapp} onChange={e => setAuthForm(a => ({ ...a, whatsapp: e.target.checked }))} />
        <span>Send my job alerts to WhatsApp too. We'll never call you or share your number.</span>
      </label>}
      {authMode !== "reset" && <label>Email<input type="email" value={authForm.email} onChange={e => setAuthForm(a => ({ ...a, email: e.target.value }))} autoComplete="email" autoFocus={authMode !== "signup"} onKeyDown={e => e.key === "Enter" && authMode === "forgot" && submitAuth()} /></label>}
      {authMode !== "forgot" && <label>{authMode === "reset" ? "New password" : "Password"}<input type="password" value={authForm.password} onChange={e => setAuthForm(a => ({ ...a, password: e.target.value }))} autoComplete={authMode === "signin" ? "current-password" : "new-password"} onKeyDown={e => e.key === "Enter" && authMode === "signin" && submitAuth()} autoFocus={authMode === "reset"} /></label>}
      {(authMode === "signup" || authMode === "reset") && <label>Confirm password<input type="password" value={authForm.confirm} onChange={e => setAuthForm(a => ({ ...a, confirm: e.target.value }))} autoComplete="new-password" onKeyDown={e => e.key === "Enter" && submitAuth()} /></label>}
    </div>
    {TURNSTILE_KEY && (authMode === "signup" || authMode === "signin") && <div ref={captchaRef} className="captcha" />}
    {authMode === "signup" && <label className="consent"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /><span>I agree to the <button className="link-btn" onClick={() => openLegal("terms")}>Terms of Service</button> and <button className="link-btn" onClick={() => openLegal("privacy")}>Privacy Policy</button>, and I'm 18 or older.</span></label>}
    {authStatus.text && <p className={`auth-status ${authStatus.type}`}>{authStatus.text}{authStatus.type === "ok" && authMode === "signup" && <> Didn't get it? <button className="link-btn" onClick={resendConfirmation}>Resend</button></>}</p>}
    <button className="primary-btn auth-submit" onClick={submitAuth} disabled={authBusy}>
      {authBusy ? <RefreshCw className="spin" size={15} /> : null}
      {{ signin: "Sign in", signup: "Create account", forgot: "Send reset link", reset: "Update password" }[authMode]}
    </button>
    <div className="auth-links">
      {authMode === "signin" && <><button className="link-btn" onClick={() => setAuthMode("forgot")}>Forgot password?</button><span>New here? <button className="link-btn" onClick={() => setAuthMode("signup")}>Create an account</button></span></>}
      {authMode === "signup" && <span>Already have an account? <button className="link-btn" onClick={() => setAuthMode("signin")}>Sign in</button></span>}
      {authMode === "forgot" && <button className="link-btn" onClick={() => setAuthMode("signin")}>Back to sign in</button>}
    </div>
    </>
  );

  const TOUR = [
    { icon: <Search size={26} />, title: "Search LinkedIn, live", text: "Type a job title or skill, pick a city and country, and hit Search. Results come straight from LinkedIn — posted date, salary, Easy Apply and all." },
    { icon: <Bookmark size={26} />, title: "Save what you like", text: "Click Save on any job and it's kept in Saved Jobs, synced to every device you sign in on. Click a title to read the full description before you apply." },
    { icon: <BellRing size={26} />, title: "Let the jobs come to you", text: "Click Create alert next to the results and we'll re-run that search every morning and email you only the new postings. Pause or delete alerts any time." },
    { icon: <Download size={26} />, title: "Export in one click", text: "Tick the jobs you want (or all of them) and download a CSV for Excel or Google Sheets. Your exports are listed under Downloads." }
  ];

  const showTable = view === "search" || view === "saved";
  const emptyLive = live && view === "search" && !jobs.length && !loading;

  /* ================================================================ */
  const openLegal = (page) => { setLegalPage(page); window.history.replaceState({}, "", `?page=${page}`); window.scrollTo(0, 0); };
  const closeLegal = () => { setLegalPage(null); window.history.replaceState({}, "", window.location.pathname); };
  if (jobPage) {
    const j = jobPage.job;
    return (
      <div className="legal">
        <style>{CSS}</style>
        <div className="legal-inner jobpage">
          <button className="link-btn" onClick={closeJobPage}><ArrowLeft size={14} /> {user ? "Back to search" : "Go to LinkedIn Job Finder"}</button>
          {jobPage.loading && <div className="empty standalone"><RefreshCw className="spin" size={24} /><strong>Loading job…</strong></div>}
          {jobPage.missing && <div className="empty standalone"><X size={26} /><strong>This job isn't available</strong><span>The link may be old, or the listing has expired.</span></div>}
          {j && <>
            <div className="drawer-head" style={{ marginTop: 18 }}>
              <div className="company-logo big">{companyInitial(j.company)}</div>
              <div className="drawer-title"><h2>{j.title}</h2><div className="drawer-company"><span><Building2 size={13} /> {j.company}</span><span><MapPin size={13} /> {j.location}</span><span><Clock3 size={13} /> {j.posted}</span></div></div>
            </div>
            <div className="drawer-facts" style={{ marginTop: 16 }}>
              <Fact label="Salary" value={j.salary || "Not disclosed"} /><Fact label="Experience" value={j.experience} /><Fact label="Job type" value={j.type} /><Fact label="Workplace" value={j.workplace} /><Fact label="Easy Apply" value={j.easyApply ? "Yes" : "No"} />{j.applicants != null && <Fact label="Applicants" value={String(j.applicants)} />}
            </div>
            {j.skills?.length > 0 && <div className="drawer-section" style={{ marginTop: 16 }}><h4>Skills</h4><div className="skill-list">{j.skills.map((sk, i) => <span className="chip" key={i}>{sk}</span>)}</div></div>}
            <div className="drawer-section" style={{ marginTop: 16 }}><h4>Description</h4>{j.description ? <p className="description">{j.description}</p> : <p className="muted">Open on LinkedIn for the full description.</p>}</div>
            <div className="drawer-actions" style={{ marginTop: 20 }}>
              <button className="secondary-btn" onClick={() => copy(jobLink(j))}><Link2 size={15} /> Copy link</button>
              {user ? <button className="secondary-btn" onClick={() => toggleSaved(j)}>{isSaved(j) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {isSaved(j) ? "Saved" : "Save job"}</button> : <button className="secondary-btn" onClick={() => { closeJobPage(); openAuth("signup"); }}><UserPlus size={15} /> Create a free account to save it</button>}
              <a className="primary-btn" href={j.url} target="_blank" rel="noreferrer"><Briefcase size={15} /> Apply on LinkedIn <ExternalLink size={13} /></a>
            </div>
            {!user && <div className="jobpage-cta"><Sparkles size={15} /> Want every new {j.title.split(" ").slice(0, 2).join(" ")} role emailed to you? <button className="link-btn" onClick={() => { closeJobPage(); openAuth("signup"); }}>Create a free account</button> and set an alert in 30 seconds.</div>}
          </>}
        </div>
      </div>
    );
  }

  if (legalPage === "privacy" || legalPage === "terms") {
    const doc = legalPage === "privacy" ? PRIVACY : TERMS;
    return (
      <div className="legal">
        <style>{CSS}</style>
        <div className="legal-inner">
          <button className="link-btn" onClick={closeLegal}><ArrowLeft size={14} /> Back to {user ? "the app" : "sign in"}</button>
          <div className="brand" style={{ marginTop: 18 }}><div className="brand-icon"><Search size={22} /></div><div><strong>LinkedIn</strong><span>Job Finder</span></div></div>
          <h1>{doc.title}</h1>
          <p className="legal-intro">{doc.intro}</p>
          {doc.sections.map(([h, items], i) => (
            <section key={i}><h2>{i + 1}. {h}</h2><ul>{items.map((t, j) => <li key={j}>{t}</li>)}</ul></section>
          ))}
          <div className="legal-switch">
            <button className="link-btn" onClick={() => openLegal(legalPage === "privacy" ? "terms" : "privacy")}><FileText size={14} /> Read the {legalPage === "privacy" ? "Terms of Service" : "Privacy Policy"}</button>
            <span className="muted">{LEGAL_CONFIG.company} · {LEGAL_CONFIG.address} · {LEGAL_CONFIG.contactEmail}</span>
          </div>
        </div>
      </div>
    );
  }

  if (supabaseEnabled && !user) {
    return (
      <div className="gate">
        <style>{CSS}</style>
        <div className="gate-left">
          <div className="brand"><div className="brand-icon"><Search size={22} /></div><div><strong>LinkedIn</strong><span>Job Finder</span></div></div>
          <h1>Every new LinkedIn job that matches you — in one place, every morning.</h1>
          <p className="gate-lead">Search live LinkedIn listings by title, city and country. Save the good ones. Set an alert and we'll email you only the postings you haven't seen.</p>
          <ol className="gate-steps">
            <li><span className="step-num">1</span><div><strong>Create a free account</strong><span>Takes 30 seconds. We'll send a confirmation email.</span></div></li>
            <li><span className="step-num">2</span><div><strong>Search LinkedIn</strong><span>Real listings, filtered by date posted, workplace, experience and job type.</span></div></li>
            <li><span className="step-num">3</span><div><strong>Save, export, get alerts</strong><span>Bookmark jobs, download CSVs, and get new matches by email daily or weekly.</span></div></li>
          </ol>
          <div className="gate-trust"><ShieldCheck size={15} /> Your data is private to your account. We never post to LinkedIn on your behalf.</div>
          <a className="wa-btn ghost" href={waLink("Hi, I have a question about LinkedIn Job Finder.")} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Questions? WhatsApp us</a>
          <div className="gate-legal"><button className="link-btn" onClick={() => openLegal("privacy")}>Privacy Policy</button><button className="link-btn" onClick={() => openLegal("terms")}>Terms of Service</button><span className="muted">© {new Date().getFullYear()} {LEGAL_CONFIG.company} · Built by {LEGAL_CONFIG.founder}, {LEGAL_CONFIG.founderTitle}</span></div>
        </div>
        <div className="gate-right"><div className="modal gate-card">{authCard}</div></div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{CSS}</style>

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand"><div className="brand-icon"><Search size={22} /></div><div><strong>LinkedIn</strong><span>Job Finder</span></div></div>
        <nav>
          <NavItem icon={<Home size={18} />} label="Dashboard" active={view === "dashboard"} onClick={() => { setView("dashboard"); setMobileOpen(false); }} />
          <NavItem icon={<LayoutDashboard size={18} />} label="Job Search" active={view === "search"} onClick={() => { setView("search"); setMobileOpen(false); }} />
          <NavItem icon={<Bookmark size={18} />} label="Saved Jobs" count={saved.length} active={view === "saved"} onClick={() => { setView("saved"); setMobileOpen(false); }} />
          <NavItem icon={<History size={18} />} label="Search History" count={history.length || null} active={view === "history"} onClick={() => { setView("history"); setMobileOpen(false); }} />
          <NavItem icon={<Download size={18} />} label="Downloads" count={downloads.length || null} active={view === "downloads"} onClick={() => { setView("downloads"); setMobileOpen(false); }} />
          <NavItem icon={<Bell size={18} />} label="Job Alerts" count={alerts.length || null} active={view === "alerts"} onClick={() => { setView("alerts"); setMobileOpen(false); }} />
          {supabaseEnabled && <NavItem icon={isPro ? <Crown size={18} /> : <Zap size={18} />} label={isPro ? "Pro plan" : "Upgrade"} active={view === "plans"} onClick={() => { setView("plans"); setMobileOpen(false); }} />}
          {isAdmin && <NavItem icon={<BarChart3 size={18} />} label="Admin" active={view === "admin"} onClick={() => { setView("admin"); setMobileOpen(false); }} />}
          <NavItem icon={<Settings size={18} />} label="Settings" active={view === "settings"} onClick={() => { setView("settings"); setMobileOpen(false); }} />
          <NavItem icon={<HelpCircle size={18} />} label="How it works" active={false} onClick={() => { setTourStep(0); setTourOpen(true); setMobileOpen(false); }} />
          <NavItem icon={<MessageSquarePlus size={18} />} label="Send feedback" active={false} onClick={() => { setFeedbackOpen(true); setMobileOpen(false); }} />
        </nav>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />} {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div className="sidebar-legal"><button className="link-btn" onClick={() => openLegal("privacy")}>Privacy</button> · <button className="link-btn" onClick={() => openLegal("terms")}>Terms</button></div>
          {supabaseEnabled && (user
            ? <div className="user-card"><div className="avatar">{(displayName || "?").slice(0, 1).toUpperCase()}</div><div className="user-text"><strong title={user.email}>{displayName}</strong><small><Cloud size={11} /> Synced to your account</small></div><button className="icon-btn small" onClick={signOut} title="Sign out"><LogOut size={15} /></button></div>
            : <div className="auth-buttons"><button className="signin-btn" onClick={() => openAuth("signin")}><LogIn size={16} /> Sign in</button><button className="signup-btn" onClick={() => openAuth("signup")}><UserPlus size={16} /> Create account</button></div>)}
          <div className="source-card"><div className="source-title"><Linkedin size={16} /> LinkedIn jobs only</div><p>{isAdmin || !supabaseEnabled ? "Search results are designed around LinkedIn job listings. Connect your own compliant data source through n8n." : "Live listings pulled from LinkedIn. New matches can be sent to you daily or weekly."}</p></div>
          {(isAdmin || !supabaseEnabled) && <button className="api-card" onClick={() => setView("settings")}>
            <span className={`status-dot ${live ? "live" : ""}`}></span>
            <div><strong>{live ? "n8n connected" : "Demo mode"}</strong><small>{live ? "Apify webhook ready" : "Add webhook in Settings"}</small></div>
          </button>}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(v => !v)} aria-label="Menu"><Menu /></button>
          <div><h1>LinkedIn Job Finder</h1><div className="subtitle"><Linkedin size={14} /> LinkedIn jobs only</div></div>
          {showTable && (
            <div className="top-actions">
              {view === "search" && selected.length > 0 && <button className="secondary-btn" onClick={saveSelected}><BookmarkPlus size={16} /> Save selected ({selected.length})</button>}
              <button className="secondary-btn" disabled={!selected.length} onClick={() => downloadCSV(selectedJobs, `${searchSlug()}-selected`)}><Download size={16} /> Export selected ({selected.length})</button>
              <button className="primary-btn" onClick={() => downloadCSV(filteredJobs, view === "saved" ? "saved-jobs" : undefined)}><Download size={16} /> Download CSV</button>
            </div>
          )}
        </header>

        {showTable ? (
          <>
            {view === "saved" && (
              <section className="search-row">
                <label className="input-wrap"><Search size={19} /><input value={savedQuery} onChange={e => setSavedQuery(e.target.value)} placeholder={`Filter your ${saved.length} saved job${saved.length === 1 ? "" : "s"} by title, company or location`} /></label>
                {savedQuery && <button className="secondary-btn" onClick={() => setSavedQuery("")}><X size={16} /> Clear</button>}
              </section>
            )}
            {view === "search" && (
              <section className="search-row">
                <label className="input-wrap"><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Job title, skills or keywords" onKeyDown={e => e.key === "Enter" && runSearch()} /></label>
                <label className="input-wrap"><MapPin size={19} /><input value={location} onChange={e => setLocation(e.target.value)} placeholder="City or Remote, e.g. Lagos, London, Remote" onKeyDown={e => e.key === "Enter" && runSearch()} /></label>
                {loading
                  ? <button className="search-btn cancel" onClick={cancelSearch}><RefreshCw className="spin" size={18} /> Searching… (cancel)</button>
                  : <button className="search-btn" onClick={() => runSearch()}><Search size={18} /> Search</button>}
              </section>
            )}

            <section className="filters-panel">
              <div className="date-filter">
                <span className="filter-label">Date posted</span>
                {DATE_FILTERS.map(([key, label]) => <button key={key} className={dateRange === key ? "date-pill selected" : "date-pill"} onClick={() => setDateRange(key)}>{label}</button>)}
              </div>
              <div className="filter-grid">
                <Select label="Country" value={country} setValue={setCountry} options={COUNTRIES} />
                <Select label="Workplace" value={workplace} setValue={setWorkplace} options={[["any", "Any"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["on-site", "On-site"]]} />
                <Select label="Experience Level" value={experience} setValue={setExperience} options={[["all", "All levels"], ["intern", "Internship"], ["entry", "Entry Level"], ["associate", "Associate"], ["mid", "Mid-Level"], ["senior", "Senior Level"], ["director", "Director"], ["executive", "Executive"]]} />
                <Select label="Job Type" value={jobType} setValue={setJobType} options={[["all", "All types"], ["full-time", "Full-time"], ["contract", "Contract"], ["part-time", "Part-time"], ["temporary", "Temporary"], ["internship", "Internship"]]} />
                <Select label="Easy Apply" value={easyApply} setValue={setEasyApply} options={[["all", "All"], ["yes", "Yes"], ["no", "No"]]} />
                <button className="clear-btn" onClick={resetFilters} disabled={!activeFilterCount}><X size={15} /> Clear filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</button>
              </div>
              <div className="filter-grid extra">
                <label className="check-filter"><input type="checkbox" checked={underTen} onChange={e => setUnderTen(e.target.checked)} /><Users size={14} /> Under 10 applicants</label>
                <label className="check-filter"><input type="checkbox" checked={salaryOnly} onChange={e => setSalaryOnly(e.target.checked)} /> Salary disclosed only</label>
                <label className="salary-filter">Min salary <span className="mono">{minSalary ? fmtMoney(minSalary) : "any"}</span>
                  <input type="range" min="0" max="300000" step="5000" value={minSalary} onChange={e => setMinSalary(Number(e.target.value))} />
                </label>
                {view === "search" && query.trim() && <button className="link-btn" onClick={saveCurrentSearch}><Star size={13} /> Save this search</button>}
                {view === "search" && query.trim() && <button className="link-btn" onClick={() => copySearchLink()}><Link2 size={13} /> Copy search link</button>}
              </div>
            </section>

            {error && <div className="banner error"><AlertTriangle size={15} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {notice && <div className="banner"><Info size={15} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {upgradePrompt && !isPro && <div className="banner upgrade"><Crown size={15} /><span>{upgradePrompt === "searches" ? "You've used all your free searches for today." : "Free accounts get 1 job alert."} <strong>Pro</strong> gives you {upgradePrompt === "searches" ? "100 searches a day" : "10 alerts"} for ₦{PRO_NGN.toLocaleString()}/month.</span><button className="primary-btn small-btn" onClick={() => setView("plans")}>See plans</button><a className="wa-btn small" href={waLink(`Hi, I hit my ${upgradePrompt === "searches" ? "daily search" : "alert"} limit and want to upgrade to Pro.`)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp us</a><button onClick={() => setUpgradePrompt("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {view === "search" && followUpsDue.length > 0 && <div className="banner warn"><CalendarClock size={15} /><span>{followUpsDue.length} follow-up{followUpsDue.length === 1 ? "" : "s"} due: {followUpsDue.slice(0, 3).map(j => `${j.title} at ${j.company}`).join(" · ")}{followUpsDue.length > 3 ? " …" : ""}</span><button className="link-btn" onClick={() => { setView("saved"); setSavedView("board"); }}>Open tracker</button></div>}

            <section className="results-head">
              <div className="results-count">
                <strong>{filteredJobs.length}</strong> {view === "saved" ? "saved" : "LinkedIn"} job{filteredJobs.length === 1 ? "" : "s"} {view === "saved" && filteredJobs.length !== saved.length ? `of ${saved.length}` : "found"}
                <span className="source-badge"><Linkedin size={12} /> LinkedIn</span>
                {view === "search" && resultMeta?.source === "cache" && <span className="meta-badge"><Database size={11} /> cached {relativeLabel((Date.now() - resultMeta.at) / 36e5).toLowerCase()}</span>}
                {view === "search" && resultMeta?.source === "live" && <span className="meta-badge live"><Plug size={11} /> fetched {relativeLabel((Date.now() - resultMeta.at) / 36e5).toLowerCase()}</span>}
                {view === "search" && live && resultMeta?.params && !loading && <button className="link-btn" onClick={refreshSearch}><RotateCcw size={12} /> Refresh</button>}
                {view === "search" && query.trim() && <button className="link-btn" onClick={startAlert}><BellRing size={12} /> Create alert</button>}
                {view === "search" && usage && <span className={`meta-badge ${usage.limit != null && usage.used >= usage.limit ? "warn" : ""}`}><Gauge size={11} /> {usage.limit == null ? `${usage.used} searches today` : `${usage.used} of ${usage.limit} searches today`}</span>}
                {view === "search" && filteredJobs.length !== basePool.length && <span className="muted-note">({basePool.length - filteredJobs.length} hidden by filters)</span>}
              </div>
              {view === "saved" && <div className="view-toggle"><button className={savedView === "list" ? "on" : ""} onClick={() => setSavedView("list")}><List size={14} /> List</button><button className={savedView === "board" ? "on" : ""} onClick={() => setSavedView("board")}><LayoutGrid size={14} /> Board</button></div>}
              <label className="sort-control">Sort by:
                <select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="recent">Most recent</option><option value="salary">Salary</option><option value="company">Company</option><option value="title">Title</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </section>

            {view === "saved" && savedView === "board" ? (
              <section className="board">
                {STATUSES.map(([key, label]) => {
                  const col = filteredJobs.filter(j => (j.status || "saved") === key);
                  return (
                    <div className="board-col" key={key} onDragOver={e => e.preventDefault()} onDrop={e => { const k = e.dataTransfer.getData("text/plain"); const job = saved.find(j => jobKey(j) === k); if (job && (job.status || "saved") !== key) setStatus(job, key); }}>
                      <div className="board-head"><span className={`status-dot-sm ${key}`} />{label}<span className="board-count">{col.length}</span></div>
                      {col.map(job => (
                        <div className="board-card" key={jobKey(job)} draggable onDragStart={e => e.dataTransfer.setData("text/plain", jobKey(job))} onClick={() => setDetailJob(job)}>
                          <strong>{job.title}</strong>
                          <span>{job.company} · {job.location}</span>
                          <div className="board-meta">
                            {job.appliedAt && <span><CalendarClock size={11} /> applied {job.appliedAt}</span>}
                            {job.followUpAt && <span className={job.followUpAt <= today ? "due" : ""}><Bell size={11} /> follow up {job.followUpAt}</span>}
                            {job.interviewAt && <span className="due"><CalendarClock size={11} /> interview {new Date(job.interviewAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>}
                            {job.cvVersion && <span title={`CV sent: ${job.cvVersion}`}><FileIcon size={11} /> {job.cvVersion}</span>}
                            {job.notes && <span title={job.notes}><FileText size={11} /> note</span>}
                          </div>
                        </div>
                      ))}
                      {!col.length && <div className="board-empty">Drag a job here</div>}
                    </div>
                  );
                })}
              </section>
            ) : (
            <section className="table-card">
              {loading && <div className="loading-bar"><span /></div>}
              {loading && pagedJobs.length > 0 && <div className="progress-strip"><RefreshCw className="spin" size={13} /> {progress?.stage || "Searching…"} {progress && <Elapsed since={progress.startedAt} />}</div>}
              <div className="table-scroll">
                <table>
                  <thead><tr>
                    <th className="check-col"><input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} disabled={!pagedJobs.length} /></th>
                    <th>Job</th><th>Location</th><th>Posted</th><th>Experience</th><th>Salary</th><th>Easy Apply</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {pagedJobs.map(job => <tr key={jobKey(job)} className={detailJob && jobKey(detailJob) === jobKey(job) ? "row-active" : ""}>
                      <td><input type="checkbox" checked={selectedKeys.has(jobKey(job))} onChange={() => toggleSelected(job)} /></td>
                      <td>
                        <div className="job-cell">
                          <div className="company-logo">{companyInitial(job.company)}</div>
                          <div className="job-text">
                            <button className="job-title" onClick={() => setDetailJob(job)} title="View details">{job.title}</button>
                            <div className="company-name"><button className="company-link" onClick={() => setCompanyView(job.company)} title="See all roles from this company">{job.company}</button>{job.workplace !== "Unknown" && <span className="chip">{job.workplace}</span>}{job.type && <span className="chip">{job.type}</span>}{job.applicants != null && job.applicants < 10 && <span className="chip hot"><Users size={10} /> {job.applicants} applicants</span>}{isNew(job) && <span className="chip new"><Sparkle size={10} /> New</span>}{viewedAgo(job) && <span className="chip viewed" title={`You opened this ${viewedAgo(job).toLowerCase()}`}>Opened {viewedAgo(job).toLowerCase()}</span>}{view === "saved" && <span className={`chip status ${job.status || "saved"}`}>{STATUSES.find(([k]) => k === (job.status || "saved"))?.[1]}</span>}</div>
                          </div>
                        </div>
                      </td>
                      <td>{job.location}</td>
                      <td><span className="posted"><Clock3 size={13} />{job.posted}</span></td>
                      <td>{job.experience}</td>
                      <td className="salary">{job.salary}</td>
                      <td>{job.easyApply ? <span className="easy"><CheckCircle2 size={14} /> Yes</span> : <span className="muted">No</span>}</td>
                      <td>
                        <div className="row-actions">
                          <button className="save-btn" onClick={() => toggleSaved(job)}>{isSaved(job) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {isSaved(job) ? "Saved" : "Save"}</button>
                          <a className={viewed[jobKey(job)] ? "view-btn opened" : "view-btn"} href={job.url} target="_blank" rel="noreferrer" onClick={e => openJob(job, e)}>
                            {viewed[jobKey(job)] ? <><Check size={13} /> Opened</> : <>View Job <ExternalLink size={13} /></>}
                          </a>
                          {view === "search" && <div className="hide-menu">
                            <button className="icon-btn tiny" title="Hide or block"><EyeOff size={14} /></button>
                            <div className="hide-pop">
                              <button onClick={() => addFilter("hidden_job", jobKey(job), job.title)}><EyeOff size={13} /> Hide this job</button>
                              <button onClick={() => addFilter("blocked_company", job.company, job.company)}><Ban size={13} /> Block {job.company}</button>
                            </div>
                          </div>}
                        </div>
                      </td>
                    </tr>)}
                    {!pagedJobs.length && !loading && (
                      <tr><td colSpan="8">
                        <div className="empty">
                          {view === "saved" ? <Bookmark size={28} /> : emptyLive ? <Search size={28} /> : <X size={28} />}
                          <strong>{view === "saved" ? (saved.length ? "No saved jobs match these filters" : "No saved jobs yet") : emptyLive ? "Search LinkedIn to get started" : "No jobs match these filters"}</strong>
                          <span>{view === "saved" ? (saved.length ? "Clear the filter or the date range above to see all of them." : "Save a job from your search results to keep it here.") : emptyLive ? "Pick one to get started, or type your own above." : "Try a broader keyword, a wider date range, or one of these."}</span>
                          {view === "search" && (
                            <div className="suggestions">
                              {(profile?.target_roles?.length ? profile.target_roles : ROLE_SUGGESTIONS.slice(0, 6)).slice(0, 6).map(r => {
                                const c = profile?.target_countries?.[0] || "";
                                return <button className="suggestion" key={r} onClick={() => { setQuery(r); setCountry(c); resetFilters(); runSearch({ query: r, country: c, __source: "suggestion" }); }}>
                                  <Search size={12} /> {r}{c ? ` · ${c}` : ""}
                                </button>;
                              })}
                            </div>
                          )}
                          {(view === "search" ? (!emptyLive && activeFilterCount > 0) : (saved.length > 0)) && <button onClick={resetFilters}>Reset filters</button>}
                        </div>
                      </td></tr>
                    )}
                    {loading && !pagedJobs.length && <tr><td colSpan="8"><div className="empty"><RefreshCw className="spin" size={26} /><strong>{progress?.stage || "Fetching LinkedIn listings…"}</strong><span>{progress ? <Elapsed since={progress.startedAt} /> : "This can take 30 seconds to a couple of minutes."} You can keep browsing — results appear here when ready.</span></div></td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>Showing {filteredJobs.length ? (safePage - 1) * pageSize + 1 : 0} to {Math.min(safePage * pageSize, filteredJobs.length)} of {filteredJobs.length} jobs</span>
                <div className="footer-right">
                  <label className="page-size">Rows
                    <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>{PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}</select>
                  </label>
                  <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
                </div>
              </div>
            </section>
            )}
          </>
        ) : view === "dashboard" ? (
          <>
            {error && <div className="banner error"><AlertTriangle size={15} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {notice && <div className="banner"><Info size={15} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {followUpsDue.length > 0 && <div className="banner warn"><CalendarClock size={15} /><span>{followUpsDue.length} follow-up{followUpsDue.length === 1 ? "" : "s"} due today: {followUpsDue.slice(0, 2).map(j => `${j.title} at ${j.company}`).join(" · ")}{followUpsDue.length > 2 ? " …" : ""}</span><button className="link-btn" onClick={() => { setView("saved"); setSavedView("board"); }}>Open tracker</button></div>}

            <section className="panel-card">
              <div className="panel-head">
                <div><h2>Hi{displayName ? `, ${displayName.split(" ")[0]}` : ""} 👋</h2><p className="panel-sub">Your job search at a glance.</p></div>
                <div className="row-actions"><button className="secondary-btn" onClick={() => setView("saved")}><LayoutGrid size={15} /> Open tracker</button><button className="primary-btn" onClick={() => setView("search")}><Search size={15} /> New search</button></div>
              </div>

              <div className="stat-grid">
                <Stat label="Applications sent" value={pipeline.totalApplied} sub={`${pipeline.thisWeek} this week`} />
                <Stat label="In progress" value={pipeline.interviewing} sub="interviewing" />
                <Stat label="Offers" value={pipeline.offer} />
                <Stat label="Response rate" value={`${pipeline.responseRate}%`} sub="of applications" />
                <Stat label="Saved, not applied" value={pipeline.saved} sub="waiting on you" />
                <Stat label="Jobs opened" value={pipeline.viewedCount} sub="View Job clicks" />
              </div>

              {pipeline.totalApplied === 0 ? (
                <div className="empty standalone"><Target size={28} /><strong>No applications tracked yet</strong><span>Save a job, then set its status to Applied — this page fills in as you go.</span><button onClick={() => setView("search")}>Find jobs</button></div>
              ) : (
                <div className="chart-grid" style={{ marginTop: 18 }}>
                  <div className="chart-card"><h3><TrendingUp size={13} /> Applications per week</h3>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={pipeline.last8Weeks}><CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-dim)" }} /><YAxis allowDecimals={false} width={26} tick={{ fontSize: 11, fill: "var(--text-dim)" }} /><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} /><Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} /></BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-card"><h3><Briefcase size={13} /> Pipeline</h3>
                    <div className="funnel">
                      {STATUSES.map(([k, l]) => {
                        const n = pipeline[k === "saved" ? "saved" : k] || 0;
                        const pct = saved.length ? Math.round((n / saved.length) * 100) : 0;
                        return <div className="funnel-row" key={k}>
                          <span className="funnel-label"><span className={`status-dot-sm ${k}`} />{l}</span>
                          <div className="funnel-bar"><span className={`fill ${k}`} style={{ width: `${Math.max(pct, n ? 4 : 0)}%` }} /></div>
                          <strong>{n}</strong>
                        </div>;
                      })}
                    </div>
                  </div>
                </div>
              )}

              {upcomingInterviews.length > 0 && <>
                <h3 style={{ fontSize: 14, margin: "22px 0 6px" }}>Upcoming interviews</h3>
                {upcomingInterviews.slice(0, 4).map(j => (
                  <div className="history-row" key={jobKey(j)}>
                    <div>
                      <strong>{j.title}</strong><span> · {j.company}</span>
                      <div className="history-time"><CalendarClock size={11} /> {new Date(j.interviewAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}{j.interviewNote ? ` · ${j.interviewNote}` : ""}</div>
                    </div>
                    <div className="row-actions">
                      <button className="secondary-btn" onClick={() => addToCalendar(j)}><CalendarPlus size={14} /> Add to calendar</button>
                      <button className="secondary-btn" onClick={() => setDetailJob(j)}><Eye size={14} /> Open</button>
                    </div>
                  </div>
                ))}
              </>}

              {pipeline.recent.length > 0 && <>
                <h3 style={{ fontSize: 14, margin: "22px 0 6px" }}>Recent activity</h3>
                {pipeline.recent.map(j => (
                  <div className="history-row" key={jobKey(j)}>
                    <div>
                      <strong>{j.title}</strong><span> · {j.company}</span>
                      <div className="history-time">{j.appliedAt ? `Applied ${j.appliedAt}` : `Saved ${new Date(j.savedAt).toLocaleDateString()}`}{j.followUpAt ? ` · follow up ${j.followUpAt}` : ""}</div>
                    </div>
                    <div className="row-actions">
                      <span className={`chip status ${j.status || "saved"}`}>{STATUSES.find(([k]) => k === (j.status || "saved"))?.[1]}</span>
                      <button className="secondary-btn" onClick={() => setDetailJob(j)}><Eye size={14} /> Open</button>
                    </div>
                  </div>
                ))}
              </>}
            </section>
          </>
        ) : view === "plans" ? (
          <section className="panel-card">
            <div className="panel-head"><div><h2>Plans</h2><p className="panel-sub">Every search runs a live LinkedIn scrape, which costs us money — Pro keeps the lights on and removes the limits.</p></div></div>
            {error && <div className="banner error"><AlertTriangle size={15} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {notice && <div className="banner"><Info size={15} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}
            <div className="plan-grid">
              <div className={`plan ${!isPro ? "current" : ""}`}>
                <h3>Free</h3><div className="price">₦0<span>/month</span></div>
                <ul>{PLAN_FEATURES.free.map(f => <li key={f}><Check size={14} /> {f}</li>)}</ul>
                {!isPro ? <span className="plan-current">Your current plan</span> : <span className="muted">Included in Pro</span>}
              </div>
              <div className={`plan pro ${isPro ? "current" : ""}`}>
                <div className="plan-badge"><Crown size={12} /> Most popular</div>
                <h3>Pro</h3><div className="price">₦{PRO_NGN.toLocaleString()}<span>/month</span> <small>or ${PRO_USD}</small></div>
                <ul>{PLAN_FEATURES.pro.map(f => <li key={f}><Check size={14} /> {f}</li>)}</ul>
                {isPro ? <span className="plan-current">Your current plan{profile?.plan_expires_at ? ` · renews ${new Date(profile.plan_expires_at).toLocaleDateString()}` : ""}</span> : (
                  <div className="plan-actions">
                    <button className="primary-btn" onClick={payWithPaystack} disabled={payBusy || !PAYSTACK_KEY}>{payBusy ? <RefreshCw className="spin" size={15} /> : <Zap size={15} />} Pay ₦{PRO_NGN.toLocaleString()} with Paystack</button>
                    <button className="secondary-btn" onClick={payWithStripe} disabled={!STRIPE_LINK}>Pay ${PRO_USD} by card (Stripe)</button>
                    <a className="wa-btn" href={waLink(`Hi, I'd like to upgrade to Pro on LinkedIn Job Finder.\n\nMy account email: ${user?.email || ""}`)} target="_blank" rel="noreferrer">
                      <MessageCircle size={16} /> Upgrade on WhatsApp
                    </a>
                    <span className="muted" style={{ fontSize: 12, textAlign: "center" }}>
                      {PAYSTACK_KEY || STRIPE_LINK ? "Prefer to pay by transfer? Message us and we'll set you up." : "Card payments are coming — message us on WhatsApp and we'll activate Pro for you today."}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="contact-card">
              <div className="wa-icon"><MessageCircle size={20} /></div>
              <div>
                <strong>Questions before you upgrade?</strong>
                <span>Message us on WhatsApp — we usually reply within a few hours, Lagos time.</span>
              </div>
              <a className="wa-btn" href={waLink("Hi, I have a question about LinkedIn Job Finder.")} target="_blank" rel="noreferrer"><Phone size={15} /> {LEGAL_CONFIG.whatsappDisplay}</a>
            </div>
            <p className="panel-sub" style={{ marginTop: 14 }}>Cancel any time. Pro stays active until the end of the period you paid for. Questions: {LEGAL_CONFIG.contactEmail} or WhatsApp {LEGAL_CONFIG.whatsappDisplay}.</p>
            {payments.length > 0 && <><h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>Payment history</h3>{payments.map((p, i) => <div className="settings-row" key={i}><strong>{new Date(p.created_at).toLocaleDateString()} · {p.provider}</strong><span>{p.currency?.toUpperCase()} {p.amount} · {p.status} · {p.reference}</span></div>)}</>}
          </section>
        ) : view === "admin" ? (
          <section className="panel-card">
            <div className="panel-head"><div><h2>Admin dashboard</h2><p className="panel-sub">Usage across all accounts. Server-logged searches only.</p></div>
              <div className="row-actions">{[7, 14, 30].map(d => <button key={d} className={`secondary-btn ${adminDays === d ? "on" : ""}`} onClick={() => setAdminDays(d)}>{d}d</button>)}<button className="secondary-btn" onClick={() => db.adminStats(adminDays).then(setAdminStats).catch(e => setError(e.message))}><RefreshCw size={14} /></button></div></div>
            {error && <div className="banner error"><AlertTriangle size={15} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {!adminStats ? <div className="empty standalone"><RefreshCw className="spin" size={24} /><strong>Loading…</strong></div> : (
              <>
                <div className="stat-grid">
                  <Stat label="Users" value={adminStats.users_total} sub={`+${adminStats.users_7d} this week`} />
                  <Stat label="Searches today" value={adminStats.searches_today} sub={`${adminStats.searches_total} all time`} />
                  <Stat label="Active alerts" value={adminStats.alerts_active} sub={`${adminStats.alerts_total} total`} />
                  <Stat label="Saved jobs" value={adminStats.saved_jobs_total} />
                  <Stat label="Est. Apify spend" value={`$${(adminStats.searches_total * 50 * APIFY_COST_PER_JOB).toFixed(2)}`} sub={`≈ $${(50 * APIFY_COST_PER_JOB).toFixed(2)} / search`} />
                  <Stat label="Plans" value={(adminStats.users_by_plan || []).map(p => `${p.count} ${p.plan}`).join(" · ") || "—"} />
                </div>
                <div className="chart-grid">
                  <div className="chart-card"><h3>Searches per day</h3>
                    <ResponsiveContainer width="100%" height={200}><BarChart data={adminStats.searches_per_day.map(d => ({ ...d, day: String(d.day).slice(5) }))}><CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} /><Tooltip /><Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                  <div className="chart-card"><h3>Top keywords (30d)</h3>
                    <ResponsiveContainer width="100%" height={200}><BarChart data={adminStats.top_keywords} layout="vertical" margin={{ left: 10 }}><XAxis type="number" hide /><YAxis type="category" dataKey="keyword" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#6db3aa" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
                  <div className="chart-card"><h3>Top countries (30d)</h3>
                    <ResponsiveContainer width="100%" height={200}><BarChart data={adminStats.top_countries} layout="vertical" margin={{ left: 10 }}><XAxis type="number" hide /><YAxis type="category" dataKey="country" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#e2a63b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
                </div>
                <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>Recent users</h3>
                <div className="table-scroll"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Searches</th><th>Alerts</th><th>Joined</th></tr></thead>
                  <tbody>{adminStats.recent_users.map((u, i) => <tr key={i}><td>{u.name || "—"}</td><td>{u.email}</td><td><span className="chip">{u.plan}</span></td><td>{u.searches}</td><td>{u.alerts}</td><td>{new Date(u.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
                <p className="panel-sub" style={{ marginTop: 12 }}>Change a plan: run <code>update profiles set plan='pro', daily_search_limit=100, max_alerts=10 where email='…'</code> in Supabase.</p>
              </>
            )}
          </section>
        ) : view === "alerts" ? (
          <section className="panel-card">
            <div className="panel-head">
              <div><h2>Job Alerts</h2><p className="panel-sub">Saved searches that n8n re-runs on a schedule. You only get postings you haven't been sent before.</p></div>
              {cloud && !alertDraft && <div className="row-actions"><span className="meta-badge"><Bell size={11} /> {alerts.length} of {profile?.max_alerts ?? 1} alert{(profile?.max_alerts ?? 1) === 1 ? "" : "s"} used</span>{!isPro && alerts.length >= (profile?.max_alerts ?? 1) && <button className="secondary-btn" onClick={() => setView("plans")}><Crown size={14} /> Upgrade for more</button>}<button className="primary-btn" onClick={startAlert}><Plus size={15} /> New alert from current search</button></div>}
            </div>
            {error && <div className="banner error"><AlertTriangle size={15} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {notice && <div className="banner"><Info size={15} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {!supabaseEnabled && <div className="empty standalone"><Cloud size={28} /><strong>Alerts need Supabase</strong><span>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, run supabase/schema.sql, and import the alerts workflow into n8n.</span></div>}
            {supabaseEnabled && !user && <div className="empty standalone"><LogIn size={28} /><strong>Sign in to use alerts</strong><span>Alerts are tied to your account so we know where to send them.</span><div className="row-actions"><button onClick={() => openAuth("signin")}>Sign in</button><button onClick={() => openAuth("signup")}>Create account</button></div></div>}
            {cloud && alertDraft && (
              <div className="alert-form">
                <h3><BellRing size={15} /> New alert</h3>
                <div className="form-grid">
                  <label>Name<input value={alertDraft.name} onChange={e => setAlertDraft(d => ({ ...d, name: e.target.value }))} /></label>
                  <label>Keyword<input value={alertDraft.params.query} onChange={e => setAlertDraft(d => ({ ...d, params: { ...d.params, query: e.target.value } }))} /></label>
                  <label>Location<input value={alertDraft.params.location} placeholder="City or Remote" onChange={e => setAlertDraft(d => ({ ...d, params: { ...d.params, location: e.target.value } }))} /></label>
                  <label>Country<select value={alertDraft.params.country} onChange={e => setAlertDraft(d => ({ ...d, params: { ...d.params, country: e.target.value } }))}>{COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                  <label>Frequency<select value={alertDraft.frequency} onChange={e => setAlertDraft(d => ({ ...d, frequency: e.target.value }))}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
                  <label>Send via<select value={alertDraft.channel} onChange={e => setAlertDraft(d => ({ ...d, channel: e.target.value }))}><option value="email">Email</option><option value="telegram">Telegram</option></select></label>
                  {alertDraft.channel === "email"
                    ? <label>Email address<input type="email" value={alertDraft.email} onChange={e => setAlertDraft(d => ({ ...d, email: e.target.value }))} /></label>
                    : <label>Telegram chat ID<input value={alertDraft.telegram_chat_id} placeholder="e.g. 123456789" onChange={e => setAlertDraft(d => ({ ...d, telegram_chat_id: e.target.value }))} /></label>}
                </div>
                <p className="panel-sub">Filters carried over: {DATE_FILTERS.find(([k]) => k === alertDraft.params.dateRange)?.[1]}{alertDraft.params.dateRange === "all" ? " (alerts use Past 7 days)" : ""} · {alertDraft.params.workplace === "any" ? "any workplace" : alertDraft.params.workplace} · {alertDraft.params.experience === "all" ? "all levels" : alertDraft.params.experience} · {alertDraft.params.jobType === "all" ? "all types" : alertDraft.params.jobType}</p>
                <div className="form-actions">
                  <button className="secondary-btn" onClick={() => setAlertDraft(null)}>Cancel</button>
                  <button className="primary-btn" onClick={submitAlert} disabled={alertBusy}>{alertBusy ? <RefreshCw className="spin" size={15} /> : <Bell size={15} />} Create alert</button>
                </div>
              </div>
            )}
            {cloud && !alertDraft && !alerts.length && <div className="empty standalone"><Bell size={28} /><strong>No alerts yet</strong><span>Run a search, then click "Create alert" to get new matching jobs by email or Telegram.</span></div>}
            {cloud && alerts.map(a => (
              <div className={`history-row alert-row ${a.active ? "" : "paused"}`} key={a.id}>
                <div className="alert-main">
                  <strong>{a.name}</strong>
                  <span> · {a.params.query} · {[a.params.location, a.params.country].filter(Boolean).join(", ") || "Anywhere"} · {DATE_FILTERS.find(([k]) => k === a.params.dateRange)?.[1] || "Past 7 days"}</span>
                  <div className="history-time">
                    {a.frequency} · {a.channel === "email" ? <><Mail size={11} /> {a.email}</> : <><Send size={11} /> Telegram {a.telegram_chat_id}</>}
                    {a.last_run_at ? ` · last run ${new Date(a.last_run_at).toLocaleString()} — ${a.last_new_count} new` : " · not run yet"}
                    {a.total_sent ? ` · ${a.total_sent} sent in total` : ""}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="secondary-btn" onClick={() => rerun(a.params)} title="Run this search now"><Search size={14} /> Run</button>
                  <button className="secondary-btn" onClick={() => toggleAlert(a)} title={a.active ? "Pause" : "Resume"}><Power size={14} /> {a.active ? "Pause" : "Resume"}</button>
                  <button className="secondary-btn danger-inline" onClick={() => removeAlert(a)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </section>
        ) : view === "history" ? (
          <section className="panel-card">
            <div className="panel-head"><div><h2>Saved Searches</h2><p className="panel-sub">Re-run any time without notifications. Want it emailed? Create an alert instead.</p></div></div>
            {!savedSearches.length && <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>No saved searches yet — use "Save this search" under the filters.</p>}
            {savedSearches.map(r => (
              <div className="history-row" key={r.id}>
                <div><strong>{r.name}</strong><span> · {r.params.query} · {[r.params.location, r.params.country].filter(Boolean).join(", ") || "Anywhere"} · {DATE_FILTERS.find(([k]) => k === r.params.dateRange)?.[1] || "Any time"}</span></div>
                <div className="row-actions"><button className="secondary-btn" onClick={() => rerun(r.params)}><Search size={14} /> Run</button><button className="secondary-btn" onClick={() => copySearchLink(r.params)}><Link2 size={14} /> Copy link</button><button className="secondary-btn danger-inline" onClick={() => deleteSavedSearch(r)}><Trash2 size={14} /></button></div>
              </div>
            ))}
            <div className="panel-head" style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid var(--border)" }}><div><h2>Search History</h2><p className="panel-sub">Your last {history.length} searches. Re-run any of them with one click.</p></div>
              {history.length > 0 && <button className="secondary-btn" onClick={() => setHistory([])}><Trash2 size={15} /> Clear</button>}</div>
            {!history.length && <div className="empty standalone"><History size={28} /><strong>No searches yet</strong><span>Run a search and it'll show up here.</span></div>}
            {history.map((h, i) => (
              <div className="history-row" key={i}>
                <div>
                  <strong>{h.query || "(any keyword)"}</strong>
                  <span> · {[h.location, h.country].filter(Boolean).join(", ") || "Anywhere"} · {DATE_FILTERS.find(([k]) => k === h.dateRange)?.[1] || "Any time"}{h.workplace && h.workplace !== "any" ? ` · ${h.workplace}` : ""}</span>
                  <div className="history-time">{new Date(h.at).toLocaleString()}</div>
                </div>
                <button className="secondary-btn" onClick={() => rerun(h)}><RotateCcw size={15} /> Re-run</button>
              </div>
            ))}
          </section>
        ) : view === "downloads" ? (
          <section className="panel-card">
            <div className="panel-head"><div><h2>Downloads</h2><p className="panel-sub">Your last {downloads.length} CSV exports. Files also land in your browser's downloads folder.</p></div>
              {downloads.length > 0 && <button className="secondary-btn" onClick={() => setDownloads([])}><Trash2 size={15} /> Clear</button>}</div>
            {!downloads.length && <div className="empty standalone"><Download size={28} /><strong>No downloads yet</strong><span>Export a CSV from Job Search or Saved Jobs to see it listed here.</span></div>}
            {downloads.map((d, i) => (
              <div className="history-row" key={i}>
                <div><strong>{d.label || d.filename}</strong><span> · {d.count} job{d.count === 1 ? "" : "s"}</span><div className="history-time">{d.filename} · {new Date(d.at).toLocaleString()}</div></div>
                <button className="secondary-btn" onClick={() => redownload(d)} disabled={!d.items}><Download size={15} /> Download again</button>
              </div>
            ))}
          </section>
        ) : (
          <section className="panel-card">
            <h2>Settings</h2>
            <p className="panel-sub">{isAdmin || !supabaseEnabled ? "Connect the dashboard to your n8n workflow and control how results are cached." : "Manage your account and preferences."}</p>
            {error && <div className="banner error"><AlertTriangle size={15} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}
            {notice && <div className="banner"><Info size={15} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}

            {(isAdmin || !supabaseEnabled) && <><div className="settings-block">
              <h3><Plug size={15} /> Data source</h3>
              <p className="panel-sub">Paste the production URL of your n8n Webhook node. Leave empty to use the <code>VITE_N8N_WEBHOOK_URL</code> env value{ENV_WEBHOOK ? " (currently set)" : " (not set)"}, or demo data if neither is set.</p>
              <div className="settings-form">
                <input value={webhookDraft} onChange={e => setWebhookDraft(e.target.value)} placeholder="https://your-n8n-domain/webhook/linkedin-job-search" />
                <button className="primary-btn" onClick={saveWebhook}>Save</button>
              </div>
              <div className="settings-row"><strong>Status</strong><span className={live ? "ok" : ""}>{live ? `Connected — ${webhook}` : "Demo mode (no webhook configured)"}</span></div>
              <div className="settings-row"><strong>Request sent</strong><span>POST JSON: source, query, location, country, dateRange, workplace, experience, jobType, easyApply</span></div>
              <div className="settings-row"><strong>Expected response</strong><span>Array of jobs, or {"{ jobs: [...] }"} — see README for the field names</span></div>
            </div></>}

            <div className="settings-block">
              <h3><Cloud size={15} /> Account &amp; sync</h3>
              {!supabaseEnabled && <p className="panel-sub">Supabase isn't configured — saved jobs and history stay in this browser only. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable accounts, sync and job alerts.</p>}
              {supabaseEnabled && !user && <div className="settings-form"><span className="muted">Not signed in — data is local to this browser.</span><button className="primary-btn" onClick={() => openAuth("signin")}><LogIn size={15} /> Sign in</button><button className="secondary-btn" onClick={() => openAuth("signup")}><UserPlus size={15} /> Create account</button></div>}
              {cloud && <>
                <div className="settings-row"><strong>Signed in as</strong><span className="ok">{user.email}</span></div>
                <div className="settings-row"><strong>Member since</strong><span>{new Date(profile?.created_at || user.created_at).toLocaleDateString()}</span></div>
                <div className="settings-row"><strong>Synced</strong><span>{saved.length} saved jobs · {history.length} searches · {alerts.length} alerts</span></div>
                <div className="settings-form" style={{ marginTop: 10 }}><input value={profileDraft} placeholder="Full name" onChange={e => setProfileDraft(e.target.value)} style={{ flex: "1 1 220px" }} /><button className="secondary-btn" onClick={saveProfile} disabled={profileDraft.trim() === (profile?.full_name || "")}><User size={15} /> Update name</button></div>
                <div className="settings-form"><input type="password" value={pwDraft.password} placeholder="New password" onChange={e => setPwDraft(d => ({ ...d, password: e.target.value }))} style={{ flex: "1 1 160px" }} /><input type="password" value={pwDraft.confirm} placeholder="Confirm" onChange={e => setPwDraft(d => ({ ...d, confirm: e.target.value }))} style={{ flex: "1 1 160px" }} /><button className="secondary-btn" onClick={changePassword} disabled={!pwDraft.password}><KeyRound size={15} /> Change password</button></div>
                <div className="row-actions" style={{ marginTop: 6, flexWrap: "wrap" }}>
                  <button className="secondary-btn" onClick={signOut}><LogOut size={15} /> Sign out</button>
                  <button className="secondary-btn" onClick={async () => { await auth.signOutEverywhere(); setNotice("Signed out on all devices."); }}><ShieldCheck size={15} /> Sign out everywhere</button>
                  <button className="secondary-btn danger" style={{ marginTop: 0 }} onClick={deleteAccount}><Trash2 size={15} /> Delete my account</button>
                </div>
                <div className="settings-row" style={{ marginTop: 10 }}><strong>Plan</strong><span>{profile?.plan || "free"} · {profile?.daily_search_limit ?? 5} searches/day · {profile?.max_alerts ?? 1} alert{(profile?.max_alerts ?? 1) === 1 ? "" : "s"}</span></div>
              </>}
            </div>

            {cloud && <div className="settings-block">
              <h3><Mail size={15} /> Email preferences</h3>
              <p className="panel-sub">Job alerts are managed separately on the Job Alerts page.</p>
              <label className="check-filter" style={{ marginBottom: 8 }}>
                <input type="checkbox" checked={emailPrefs.reminder_emails} onChange={async e => { const v = e.target.checked; setEmailPrefs(p => ({ ...p, reminder_emails: v })); try { await db.setEmailPrefs(user.id, { reminder_emails: v }); } catch (err) { setError(err.message); } }} />
                Follow-up &amp; interview reminders — a nudge the morning something is due
              </label>
              <label className="check-filter">
                <input type="checkbox" checked={emailPrefs.weekly_summary} onChange={async e => { const v = e.target.checked; setEmailPrefs(p => ({ ...p, weekly_summary: v })); try { await db.setEmailPrefs(user.id, { weekly_summary: v }); } catch (err) { setError(err.message); } }} />
                Weekly summary — your pipeline every Monday morning
              </label>
            </div>}

            <div className="settings-block">
              <h3><EyeOff size={15} /> Hidden &amp; blocked</h3>
              <p className="panel-sub">Jobs, companies and words you've muted. These never appear in search results.</p>
              <div className="settings-form">
                <input value={filterDraft} placeholder="Mute a word or company, e.g. 'unpaid' or 'Acme Ltd'" onChange={e => setFilterDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && filterDraft.trim()) { addFilter("muted_keyword", filterDraft.trim().toLowerCase(), filterDraft.trim()); setFilterDraft(""); } }} />
                <button className="secondary-btn" disabled={!filterDraft.trim()} onClick={() => { addFilter("muted_keyword", filterDraft.trim().toLowerCase(), filterDraft.trim()); setFilterDraft(""); }}><VolumeX size={15} /> Mute word</button>
                <button className="secondary-btn" disabled={!filterDraft.trim()} onClick={() => { addFilter("blocked_company", filterDraft.trim(), filterDraft.trim()); setFilterDraft(""); }}><Ban size={15} /> Block company</button>
              </div>
              {!filters.length && <p className="muted" style={{ fontSize: 12.5 }}>Nothing hidden yet. Use the eye icon on any search result to hide a job or block its company.</p>}
              <div className="filter-chips">
                {filters.map(f => (
                  <span className="filter-chip" key={f.id}>
                    {f.kind === "hidden_job" ? <EyeOff size={11} /> : f.kind === "blocked_company" ? <Ban size={11} /> : <VolumeX size={11} />}
                    {f.label || f.value}
                    <button onClick={() => removeFilter(f)} aria-label="Remove"><X size={11} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="settings-block">
              <h3><Sparkles size={15} /> Preferences</h3>
              {installPrompt && <div className="settings-form"><span className="muted">Install the app</span><button className="secondary-btn" onClick={installApp}><Smartphone size={15} /> Add to home screen</button></div>}
              <div className="settings-row"><strong>Need help?</strong><span><a className="wa-inline" href={waLink("Hi, I need help with LinkedIn Job Finder.")} target="_blank" rel="noreferrer"><MessageCircle size={12} /> WhatsApp {LEGAL_CONFIG.whatsappDisplay}</a></span></div>
              <div className="settings-row"><strong>Diagnostics</strong><span>{errorsEnabled ? "Error reporting on" : "Error reporting off"} · {analyticsEnabled ? "Anonymous usage stats on" : "Usage stats off"}</span></div>
              <div className="settings-form"><span className="muted">Rows per page</span><select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="pref-select">{PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}</select><button className="secondary-btn" onClick={() => { setTourStep(0); setTourOpen(true); }}><HelpCircle size={15} /> Show the tour again</button></div>
            </div>

            {(isAdmin || !supabaseEnabled) && <><div className="settings-block">
              <h3><Database size={15} /> Caching</h3>
              <p className="panel-sub">Identical searches within this window reuse the last result instead of re-running the Apify actor (saves credits and time). Set to 0 to always scrape fresh.</p>
              <div className="settings-form">
                <input type="number" min="0" max="1440" value={cacheMinutes} onChange={e => setCacheMinutes(Math.max(0, Number(e.target.value) || 0))} style={{ maxWidth: 120 }} /> <span className="muted">minutes</span>
                <button className="secondary-btn" onClick={clearCache}><Trash2 size={15} /> Clear cache ({Object.keys(cache).length})</button>
              </div>
            </div>

            <div className="settings-block">
              <h3><Trash2 size={15} /> Local data</h3>
              <div className="settings-row"><strong>Saved jobs</strong><span>{saved.length}</span></div>
              <div className="settings-row"><strong>Search history</strong><span>{history.length}</span></div>
              <div className="settings-row"><strong>Download log</strong><span>{downloads.length}</span></div>
              <button className="secondary-btn danger" onClick={clearAllData}><Trash2 size={15} /> Clear all local data</button>
            </div></>}
            {isAdmin && <p className="panel-sub" style={{ marginTop: 14 }}><ShieldCheck size={12} /> You see the technical sections because your account is an admin.</p>}
          </section>
        )}
        {installPrompt && !installDismissed && (
          <div className="install-bar">
            <Smartphone size={16} />
            <div><strong>Add to your home screen</strong><span>Opens like an app, works offline, one tap to your saved jobs.</span></div>
            <button className="primary-btn small-btn" onClick={installApp}>Install</button>
            <button className="icon-btn tiny" onClick={() => setInstallDismissed(true)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        )}

        <footer className="app-footer">
          <div>
            <strong>LinkedIn Job Finder</strong>
            <span>A product of {LEGAL_CONFIG.company} · {LEGAL_CONFIG.address}</span>
          </div>
          <div className="footer-founder">
            <div className="avatar sm">{LEGAL_CONFIG.founder.slice(0, 1)}</div>
            <div>
              <strong>{LEGAL_CONFIG.founder}</strong>
              <span>{LEGAL_CONFIG.founderTitle}{LEGAL_CONFIG.founderLinkedIn && <> · <a href={LEGAL_CONFIG.founderLinkedIn} target="_blank" rel="noreferrer"><LinkedinIcon size={11} /> LinkedIn</a></>}</span>
            </div>
          </div>
          <div className="footer-links">
            <button className="link-btn" onClick={() => setFeedbackOpen(true)}>Send feedback</button>
            <a href={waLink("Hi, I need help with LinkedIn Job Finder.")} target="_blank" rel="noreferrer"><MessageCircle size={11} /> WhatsApp</a>
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}`}>Support</a>
            <button className="link-btn" onClick={() => openLegal("privacy")}>Privacy</button>
            <button className="link-btn" onClick={() => openLegal("terms")}>Terms</button>
            <span className="muted">© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </main>

      {applyPrompt && (
        <div className="toast">
          <Briefcase size={16} />
          <div><strong>Did you apply?</strong><span>{applyPrompt.title} at {applyPrompt.company}</span></div>
          <button className="secondary-btn" onClick={() => setApplyPrompt(null)}>Not yet</button>
          <button className="primary-btn" onClick={() => { setStatus(applyPrompt, "applied"); setApplyPrompt(null); setNotice("Marked as applied — it's in your tracker."); }}><Check size={14} /> Yes, applied</button>
        </div>
      )}

      {feedbackOpen && (
        <div className="drawer-backdrop center" onClick={() => setFeedbackOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="brand-icon"><MessageSquarePlus size={18} /></div>
              <div><h2>Send us your idea</h2><p className="panel-sub" style={{ margin: 0 }}>Missing a feature? Something broken? Tell us — we read every message.</p></div>
              <button className="icon-btn" onClick={() => setFeedbackOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="auth-fields">
              <label>Type
                <select value={feedback.kind} onChange={e => setFeedback(f => ({ ...f, kind: e.target.value }))}>
                  {["Feature idea", "Bug report", "Data looks wrong", "Billing question", "Something else"].map(k => <option key={k}>{k}</option>)}
                </select>
              </label>
              <label>Your message
                <textarea rows={5} value={feedback.text} placeholder="e.g. I'd like to filter by visa sponsorship…" onChange={e => setFeedback(f => ({ ...f, text: e.target.value }))} />
              </label>
            </div>
            <button className="primary-btn auth-submit" onClick={sendFeedback} disabled={feedback.text.trim().length < 5}>Send to {LEGAL_CONFIG.feedbackEmail}</button>
            <p className="panel-sub" style={{ margin: 0, fontSize: 11.5 }}>This opens your email app so you keep a copy of what you sent.</p>
          </div>
        </div>
      )}

      {onboard && (
        <div className="drawer-backdrop center">
          <div className="modal onboard">
            <div className="onboard-progress"><span style={{ width: `${((onboard.step + 1) / 3) * 100}%` }} /></div>

            {onboard.step === 0 && <>
              <div className="tour-icon"><Rocket size={26} /></div>
              <h2>What roles are you after?</h2>
              <p className="panel-sub">Pick up to 3 — we'll run your first search and can email you new matches.</p>
              <div className="pill-grid">
                {ROLE_SUGGESTIONS.map(r => (
                  <button key={r} className={onboard.roles.includes(r) ? "pick on" : "pick"} onClick={() => setOnboard(o => ({ ...o, roles: toggleIn(o.roles, r, 3) }))}>
                    {onboard.roles.includes(r) && <Check size={12} />} {r}
                  </button>
                ))}
              </div>
              <input className="onboard-input" placeholder="Or type your own job title and press Enter"
                onKeyDown={e => { const v = e.currentTarget.value.trim(); if (e.key === "Enter" && v) { setOnboard(o => ({ ...o, roles: toggleIn(o.roles, v, 3) })); e.currentTarget.value = ""; } }} />
            </>}

            {onboard.step === 1 && <>
              <div className="tour-icon"><MapPin size={26} /></div>
              <h2>Where do you want to work?</h2>
              <p className="panel-sub">Pick up to 3 countries. Remote roles worldwide are included either way.</p>
              <div className="pill-grid">
                {ONBOARD_COUNTRIES.map(c => (
                  <button key={c} className={onboard.countries.includes(c) ? "pick on" : "pick"} onClick={() => setOnboard(o => ({ ...o, countries: toggleIn(o.countries, c, 3) }))}>
                    {onboard.countries.includes(c) && <Check size={12} />} {c}
                  </button>
                ))}
              </div>
            </>}

            {onboard.step === 2 && <>
              <div className="tour-icon"><Target size={26} /></div>
              <h2>A couple of details</h2>
              <p className="panel-sub">You can change all of this later.</p>
              <div className="onboard-row"><span>How do you want to work?</span>
                <div className="pill-grid tight">
                  {[["any", "Any"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["on-site", "On-site"]].map(([v, l]) =>
                    <button key={v} className={onboard.work === v ? "pick on" : "pick"} onClick={() => setOnboard(o => ({ ...o, work: v }))}>{l}</button>)}
                </div>
              </div>
              <div className="onboard-row"><span>Your level</span>
                <div className="pill-grid tight">
                  {[["any", "Any"], ["entry", "Entry"], ["mid", "Mid"], ["senior", "Senior"]].map(([v, l]) =>
                    <button key={v} className={onboard.level === v ? "pick on" : "pick"} onClick={() => setOnboard(o => ({ ...o, level: v }))}>{l}</button>)}
                </div>
              </div>
              <div className="onboard-summary">
                <Sparkle size={14} />
                <span>We'll search <b>{onboard.roles[0] || "jobs"}</b>{onboard.countries.length ? <> in <b>{onboard.countries.join(", ")}</b></> : ""} and show you results right away.</span>
              </div>
            </>}

            <div className="form-actions" style={{ justifyContent: "space-between", marginTop: 6 }}>
              <button className="link-btn" onClick={() => finishOnboarding(true)}>Skip for now</button>
              <div className="row-actions">
                {onboard.step > 0 && <button className="secondary-btn" onClick={() => setOnboard(o => ({ ...o, step: o.step - 1 }))}>Back</button>}
                {onboard.step < 2
                  ? <button className="primary-btn" disabled={onboard.step === 0 && !onboard.roles.length} onClick={() => setOnboard(o => ({ ...o, step: o.step + 1 }))}>Next <ArrowRight size={15} /></button>
                  : <button className="primary-btn" onClick={() => finishOnboarding(false)}><Search size={15} /> Show me jobs</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tourOpen && (
        <div className="drawer-backdrop center" onClick={finishTour}>
          <div className="modal tour" onClick={e => e.stopPropagation()}>
            <div className="tour-icon">{TOUR[tourStep].icon}</div>
            <div className="tour-dots">{TOUR.map((_, i) => <span key={i} className={i === tourStep ? "on" : ""} />)}</div>
            <h2>{TOUR[tourStep].title}</h2>
            <p>{TOUR[tourStep].text}</p>
            <div className="form-actions" style={{ justifyContent: "space-between" }}>
              <button className="secondary-btn" onClick={finishTour}>Skip</button>
              <div className="row-actions">
                {tourStep > 0 && <button className="secondary-btn" onClick={() => setTourStep(t => t - 1)}>Back</button>}
                {tourStep < TOUR.length - 1
                  ? <button className="primary-btn" onClick={() => setTourStep(t => t + 1)}>Next</button>
                  : <button className="primary-btn" onClick={finishTour}><Sparkles size={15} /> Start searching</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {authOpen && (
        <div className="drawer-backdrop center" onClick={() => authMode !== "reset" && setAuthOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {authCard}
          </div>
        </div>
      )}

      {companyView && (() => {
        const roles = dedupe([...jobs, ...saved]).filter(j => j.company === companyView);
        const info = roles.find(j => j.industry || j.companySize || j.companyDescription || j.companyUrl) || roles[0] || {};
        return (
          <div className="drawer-backdrop" onClick={() => setCompanyView(null)}>
            <aside className="drawer" onClick={e => e.stopPropagation()}>
              <div className="drawer-head">
                {info.companyLogo ? <img className="company-logo big img" src={info.companyLogo} alt="" /> : <div className="company-logo big">{companyInitial(companyView)}</div>}
                <div className="drawer-title"><h2>{companyView}</h2><div className="drawer-company">{info.industry && <span><Briefcase size={13} /> {info.industry}</span>}{info.companySize && <span><Users size={13} /> {info.companySize}</span>}{info.companyUrl && <a href={info.companyUrl} target="_blank" rel="noreferrer"><Linkedin size={13} /> LinkedIn page <ExternalLink size={11} /></a>}</div></div>
                <button className="icon-btn" onClick={() => setCompanyView(null)} aria-label="Close"><X size={18} /></button>
              </div>
              {info.companyDescription && <div className="drawer-section"><h4>About</h4><p className="description">{info.companyDescription}</p></div>}
              <div className="drawer-section"><h4>{roles.length} open role{roles.length === 1 ? "" : "s"} in your results</h4>
                {roles.map(j => <div className="company-role" key={jobKey(j)}><div><button className="job-title" onClick={() => { setCompanyView(null); setDetailJob(j); }}>{j.title}</button><div className="company-name">{j.location} · {j.posted}{j.salary && j.salary !== "Not disclosed" ? ` · ${j.salary}` : ""}</div></div><div className="row-actions"><button className="save-btn" onClick={() => toggleSaved(j)}>{isSaved(j) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}</button><a className="view-btn" href={j.url} target="_blank" rel="noreferrer">View <ExternalLink size={12} /></a></div></div>)}
                <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Shows roles from your current results and saved jobs. Search the company name to find more.</p>
              </div>
            </aside>
          </div>
        );
      })()}

      {detailJob && (
        <div className="drawer-backdrop" onClick={() => setDetailJob(null)}>
          <aside className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-head">
              <div className="company-logo big">{companyInitial(detailJob.company)}</div>
              <div className="drawer-title">
                <h2>{detailJob.title}</h2>
                <div className="drawer-company">
                  <button className="link-btn" style={{ padding: 0 }} onClick={() => { setCompanyView(detailJob.company); setDetailJob(null); }}><Building2 size={13} /> {detailJob.company}</button>
                  <span><MapPin size={13} /> {detailJob.location}</span>
                  <span><Clock3 size={13} /> {detailJob.posted}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setDetailJob(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="drawer-facts">
              <Fact label="Salary" value={detailJob.salary} />
              <Fact label="Experience" value={detailJob.experience} />
              <Fact label="Job type" value={detailJob.type} />
              <Fact label="Workplace" value={detailJob.workplace} />
              <Fact label="Easy Apply" value={detailJob.easyApply ? "Yes" : "No"} />
              {detailJob.applicants != null && <Fact label="Applicants" value={String(detailJob.applicants)} />}
              {(detailJob.salaryMin || detailJob.salaryMax) && <Fact label="Salary range" value={`${fmtMoney(detailJob.salaryMin)}${detailJob.salaryMax && detailJob.salaryMax !== detailJob.salaryMin ? " – " + fmtMoney(detailJob.salaryMax) : ""}`} />}
            </div>
            {detailJob.skills?.length > 0 && <div className="drawer-section"><h4>Skills</h4><div className="skill-list">{detailJob.skills.map((s, i) => <span className="chip" key={i}>{s}</span>)}</div></div>}
            <div className="drawer-section">
              <h4>Description</h4>
              {detailJob.description ? <p className="description">{detailJob.description}</p> : <p className="muted">No description returned for this listing. Open it on LinkedIn for the full post.</p>}
            </div>
            {isSaved(detailJob) && (() => { const sj = saved.find(j => jobKey(j) === jobKey(detailJob)) || detailJob; return (
              <div className="drawer-section tracker">
                <h4><CalendarClock size={14} /> Application tracker</h4>
                <div className="tracker-grid">
                  <label>Status<select value={sj.status || "saved"} onChange={e => setStatus(sj, e.target.value)}>{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                  <label>Applied on<input type="date" value={sj.appliedAt || ""} onChange={e => updateTracker(sj, { appliedAt: e.target.value || null, status: sj.status, notes: sj.notes, followUpAt: sj.followUpAt })} /></label>
                  <label>Follow up on<input type="date" value={sj.followUpAt || ""} onChange={e => updateTracker(sj, { followUpAt: e.target.value || null, status: sj.status, notes: sj.notes, appliedAt: sj.appliedAt })} /></label>
                </div>
                <div className="tracker-grid" style={{ marginTop: 10 }}>
                  <label>CV / resume sent<input value={sj.cvVersion || ""} placeholder="e.g. CV-automation-v3" onChange={e => updateTracker(sj, trackerPatch(sj, { cvVersion: e.target.value }))} /></label>
                  <label>Recruiter name<input value={sj.recruiterName || ""} placeholder="e.g. Ada Obi" onChange={e => updateTracker(sj, trackerPatch(sj, { recruiterName: e.target.value }))} /></label>
                  <label>Recruiter email<input type="email" value={sj.recruiterEmail || ""} placeholder="ada@company.com" onChange={e => updateTracker(sj, trackerPatch(sj, { recruiterEmail: e.target.value }))} /></label>
                </div>
                <div className="tracker-grid" style={{ marginTop: 10 }}>
                  <label>Interview date &amp; time<input type="datetime-local" value={sj.interviewAt ? new Date(sj.interviewAt).toISOString().slice(0, 16) : ""} onChange={e => updateTracker(sj, trackerPatch(sj, { interviewAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} /></label>
                  <label>Interview note<input value={sj.interviewNote || ""} placeholder="Zoom · 2nd round" onChange={e => updateTracker(sj, trackerPatch(sj, { interviewNote: e.target.value }))} /></label>
                </div>
                {sj.interviewAt && <button className="secondary-btn" style={{ marginTop: 10 }} onClick={() => addToCalendar(sj)}><CalendarPlus size={15} /> Add to calendar (.ics)</button>}
                {sj.recruiterEmail && <a className="secondary-btn" style={{ marginTop: 10, marginLeft: 8, textDecoration: "none" }} href={`mailto:${sj.recruiterEmail}?subject=${encodeURIComponent(`Following up — ${sj.title}`)}`}><Mail size={15} /> Email recruiter</a>}
                <label className="tracker-notes">Notes<textarea rows={3} value={sj.notes || ""} placeholder="What they asked, next steps, salary discussed…" onChange={e => updateTracker(sj, trackerPatch(sj, { notes: e.target.value }))} /></label>
              </div>
            ); })()}
            <div className="drawer-actions">
              {supabaseEnabled && detailJob.id && <button className="secondary-btn" onClick={() => copy(jobLink(detailJob))} title="Copy a link anyone can open"><Link2 size={15} /> Copy link</button>}
              <button className="secondary-btn" onClick={() => toggleSaved(detailJob)}>{isSaved(detailJob) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {isSaved(detailJob) ? "Saved" : "Save job"}</button>
              <a className="primary-btn" href={detailJob.url} target="_blank" rel="noreferrer" onClick={e => openJob(detailJob, e)}><Briefcase size={15} /> Apply on LinkedIn <ExternalLink size={13} /></a>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small components                                                     */
/* ------------------------------------------------------------------ */
function NavItem({ icon, label, count, active, onClick }) {
  return <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>{icon} {label}{count != null && <span className="nav-count">{count}</span>}</button>;
}
function Select({ label, value, setValue, options, disabled }) {
  return <label className="select-box"><span>{label}</span><div><select disabled={disabled} value={value} onChange={e => setValue?.(e.target.value)}>{options.map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select><ChevronDown size={14} /></div></label>;
}
function Elapsed({ since }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.round((Date.now() - since) / 1000));
  return <span className="mono">{s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`}</span>;
}
function Stat({ label, value, sub }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>;
}
function Fact({ label, value }) {
  return <div className="fact"><span>{label}</span><strong>{value}</strong></div>;
}
function Pagination({ page, pageCount, onChange }) {
  const pages = [];
  const push = (n) => pages.push(n);
  if (pageCount <= 7) { for (let i = 1; i <= pageCount; i++) push(i); }
  else {
    push(1);
    if (page > 3) push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) push(i);
    if (page < pageCount - 2) push("…");
    push(pageCount);
  }
  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous"><ChevronLeft size={16} /></button>
      {pages.map((n, i) => n === "…" ? <span key={`e${i}`} className="ellipsis">…</span> : <button key={n} className={n === page ? "page active" : "page"} onClick={() => onChange(n)}>{n}</button>)}
      <button disabled={page === pageCount} onClick={() => onChange(page + 1)} aria-label="Next"><ChevronRight size={16} /></button>
    </div>
  );
}

const CSS = `
:root, [data-theme="light"] {
  --bg: #f8f9fd; --surface: #ffffff; --surface-2: #fbfbfe; --border: #e6e8f0;
  --text: #1f2430; --text-dim: #6b7280; --text-faint: #a7acc4;
  --accent: #4f46e5; --accent-hover: #4338ca; --accent-soft: #eef0ff;
  --badge-bg: #eaf1ff; --badge-text: #2563eb; --success: #16a34a;
  --hover: #fafbfd; --chip: #f3f4f8; --grid: #eef0f5; --shadow: rgba(0,0,0,.08);
}
[data-theme="dark"] {
  --bg: #12151b; --surface: #1a1f28; --surface-2: #1e242e; --border: #2a313d;
  --text: #e8eaed; --text-dim: #9aa3b2; --text-faint: #6b7482;
  --accent: #7c74ff; --accent-hover: #8f88ff; --accent-soft: #242a44;
  --badge-bg: #1e2a44; --badge-text: #8ab4ff; --success: #4ade80;
  --hover: #202634; --chip: #252c38; --grid: #262d3a; --shadow: rgba(0,0,0,.4);
}
.app-shell {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  display: flex; min-height: 100%; background: var(--bg); color: var(--text);
}
.app-shell * { box-sizing: border-box; }
.app-shell button { font-family: inherit; cursor: pointer; }
.app-shell input, .app-shell select { font-family: inherit; }

.sidebar { width: 232px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); padding: 20px 16px; display: flex; flex-direction: column; gap: 22px; }
.brand { display: flex; align-items: center; gap: 10px; }
.brand-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--accent); color: #fff; display: grid; place-items: center; }
.brand strong { display: block; font-size: 15px; }
.brand span { font-size: 12.5px; color: var(--text-dim); }
.sidebar nav { display: flex; flex-direction: column; gap: 3px; }
.nav-item { display: flex; align-items: center; gap: 10px; background: transparent; border: none; color: var(--text-dim); padding: 9px 10px; border-radius: 8px; font-size: 13.5px; text-align: left; }
.nav-item:hover { background: var(--hover); }
.nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.nav-count { margin-left: auto; background: var(--chip); color: var(--text-dim); font-size: 11px; padding: 1px 7px; border-radius: 999px; }
.nav-item.active .nav-count { background: var(--surface); color: var(--accent); }
.sidebar-bottom { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
.source-card { background: var(--badge-bg); border-radius: 10px; padding: 12px; }
.source-title { display: flex; align-items: center; gap: 6px; color: var(--badge-text); font-size: 12.5px; font-weight: 600; }
.source-card p { font-size: 11.5px; color: var(--text-dim); margin: 6px 0 0; line-height: 1.4; }
.api-card { display: flex; align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-faint); flex-shrink: 0; }
.status-dot.live { background: var(--success); }
.api-card strong { display: block; font-size: 12.5px; }
.api-card small { color: var(--text-dim); font-size: 11px; }
.mobile-menu { display: none; }

.main { flex: 1; min-width: 0; padding: 26px clamp(16px, 3vw, 34px) 40px; }
.topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.topbar h1 { font-size: 22px; margin: 0; }
.subtitle { display: flex; align-items: center; gap: 5px; color: var(--badge-text); font-size: 12.5px; margin-top: 4px; }
.top-actions { display: flex; gap: 9px; flex-wrap: wrap; }
.primary-btn, .secondary-btn { display: inline-flex; align-items: center; gap: 7px; border-radius: 8px; padding: 9px 14px; font-size: 13px; font-weight: 500; border: 1px solid transparent; }
.primary-btn { background: var(--accent); color: #fff; }
.primary-btn:hover { background: var(--accent-hover); }
.secondary-btn { background: var(--surface); border-color: var(--border); color: var(--text); }
.secondary-btn:hover { border-color: var(--text-faint); }
.primary-btn:disabled, .secondary-btn:disabled { opacity: .45; cursor: not-allowed; }
.spin { animation: spin .9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.search-row { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.input-wrap { flex: 1 1 220px; display: flex; align-items: center; gap: 9px; background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 11px 13px; color: var(--text-dim); }
.input-wrap:focus-within { border-color: var(--accent); }
.input-wrap input { border: none; outline: none; width: 100%; font-size: 14px; color: var(--text); }
.search-btn { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #fff; border: none; border-radius: 9px; padding: 11px 20px; font-size: 14px; font-weight: 500; }
.search-btn:hover { background: var(--accent-hover); }
.search-btn:disabled { opacity: .6; }

.filters-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-top: 14px; display: flex; flex-direction: column; gap: 14px; }
.date-filter { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-label { font-size: 12.5px; font-weight: 600; color: var(--text); margin-right: 4px; }
.date-pill { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 6px 12px; font-size: 12.5px; }
.date-pill.selected { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); font-weight: 600; }
.filter-grid { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.select-box { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--text-dim); }
.select-box > div { position: relative; }
.select-box select { appearance: none; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 28px 8px 10px; font-size: 13px; color: var(--text); min-width: 140px; }
.select-box select:disabled { color: var(--text-faint); background: var(--surface-2); }
.select-box > div svg { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-dim); }
.clear-btn:disabled { opacity: .5; cursor: not-allowed; }
.clear-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text-dim); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; margin-left: auto; }

.notice { margin-top: 14px; background: var(--surface); border: 1px solid var(--border); padding: 10px 13px; border-radius: 8px; font-size: 13px; color: var(--text-dim); }

.results-head { display: flex; align-items: center; justify-content: space-between; margin-top: 18px; flex-wrap: wrap; gap: 10px; }
.results-head strong { color: var(--accent); }
.source-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--badge-bg); color: var(--badge-text); border-radius: 999px; padding: 2px 9px; font-size: 11.5px; margin-left: 6px; }
.sort-control { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-dim); position: relative; }
.sort-control select { appearance: none; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 7px 26px 7px 10px; font-size: 12.5px; color: var(--text); }
.sort-control svg { position: absolute; right: 8px; pointer-events: none; }

.table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin-top: 12px; overflow: hidden; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 760px; }
thead tr { border-bottom: 1px solid var(--border); }
th { text-align: left; padding: 11px 14px; font-size: 11.5px; color: var(--text-dim); font-weight: 600; }
.check-col { width: 34px; }
tbody tr { border-bottom: 1px solid var(--border); }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--hover); }
td { padding: 12px 14px; font-size: 13px; vertical-align: middle; }
.job-cell { display: flex; align-items: center; gap: 10px; }
.company-logo { width: 30px; height: 30px; border-radius: 8px; background: var(--text); color: #fff; display: grid; place-items: center; font-size: 12.5px; font-weight: 600; flex-shrink: 0; }
.job-title { color: var(--badge-text); text-decoration: none; font-weight: 500; display: block; }
.job-title:hover { text-decoration: underline; }
.company-name { color: var(--text-dim); font-size: 12px; }
.posted { display: flex; align-items: center; gap: 5px; color: var(--text-dim); font-size: 12.5px; }
.salary { color: var(--text); font-weight: 400; }
.easy { color: var(--success); display: flex; align-items: center; gap: 5px; font-size: 12.5px; }
.muted { color: var(--text-dim); font-size: 12.5px; }
.row-actions { display: flex; gap: 7px; }
.save-btn, .view-btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 7px; padding: 6px 10px; font-size: 12px; font-weight: 500; text-decoration: none; white-space: nowrap; }
.save-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text); }
.view-btn { background: var(--accent); color: #fff; border: 1px solid var(--accent); }
.view-btn:hover { background: var(--accent-hover); }

.empty { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 40px 20px; color: var(--text-dim); text-align: center; }
.empty.standalone { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin-top: 14px; }
.empty strong { color: var(--text); font-size: 14px; }
.empty span { font-size: 12.5px; max-width: 40ch; }
.empty svg { color: var(--text-faint); }
.empty button { margin-top: 4px; background: var(--accent-soft); color: var(--accent); border: none; border-radius: 7px; padding: 7px 13px; font-size: 12.5px; font-weight: 600; }

.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; font-size: 12.5px; color: var(--text-dim); border-top: 1px solid var(--border); flex-wrap: wrap; gap: 10px; }
.pagination { display: flex; gap: 5px; align-items: center; }
.pagination button { width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface); color: var(--text); display: grid; place-items: center; font-size: 12.5px; }
.pagination button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.pagination button:disabled { opacity: .4; cursor: not-allowed; }

.panel-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin-top: 20px; }
.panel-card h2 { margin: 0 0 4px; font-size: 17px; }
.panel-sub { color: var(--text-dim); font-size: 12.5px; margin: 0 0 16px; }
.history-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-top: 1px solid var(--border); gap: 12px; flex-wrap: wrap; }
.history-row:first-of-type { border-top: none; }
.history-row strong { font-size: 13.5px; }
.history-row span { color: var(--text-dim); font-size: 12.5px; }
.history-time { color: var(--text-faint); font-size: 11.5px; margin-top: 2px; }
.settings-row { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-top: 1px solid var(--border); font-size: 13px; flex-wrap: wrap; }
.settings-row:first-of-type { border-top: none; }
.settings-row strong { flex: 0 0 auto; }
.settings-row span { color: var(--text-dim); text-align: right; }

/* ---- onboarding ---- */
.modal.onboard { width: min(520px, calc(100% - 32px)); text-align: center; align-items: center; max-height: 90vh; overflow-y: auto; }
.onboard-progress { width: 100%; height: 4px; background: var(--chip); border-radius: 999px; overflow: hidden; }
.onboard-progress span { display: block; height: 100%; background: var(--accent); border-radius: 999px; transition: width .25s; }
.modal.onboard h2 { font-size: 19px; margin: 2px 0 0; }
.modal.onboard .panel-sub { margin: 0; }
.pill-grid { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; }
.pill-grid.tight { gap: 6px; }
.pick { display: inline-flex; align-items: center; gap: 5px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 8px 14px; font-size: 13px; color: var(--text); }
.pick:hover { border-color: var(--accent); }
.pick.on { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); font-weight: 600; }
.onboard-input { width: 100%; border: 1px solid var(--border); border-radius: 9px; padding: 10px 12px; font-size: 13.5px; font-family: inherit; background: var(--surface); color: var(--text); }
.onboard-input:focus { outline: none; border-color: var(--accent); }
.onboard-row { width: 100%; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.onboard-row > span { font-size: 12.5px; color: var(--text-dim); }
.onboard-summary { display: flex; align-items: center; gap: 8px; background: var(--accent-soft); border-radius: 10px; padding: 11px 13px; font-size: 13px; text-align: left; color: var(--text); }
.onboard-summary svg { color: var(--accent); flex-shrink: 0; }
.suggestions { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-top: 12px; }
.suggestion { display: inline-flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 7px 13px; font-size: 12.5px; color: var(--text); }
.suggestion:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

.wa-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #25D366; color: #fff; border: 1px solid #25D366; border-radius: 8px; padding: 10px 16px; font-size: 13.5px; font-weight: 600; text-decoration: none; }
.wa-btn:hover { background: #1eb959; border-color: #1eb959; }
.wa-btn.small { padding: 6px 11px; font-size: 12.5px; }
.wa-btn.ghost { background: transparent; color: #25D366; border-color: #25D366; align-self: flex-start; }
.wa-btn.ghost:hover { background: rgba(37,211,102,.1); }
.wa-inline { display: inline-flex; align-items: center; gap: 5px; color: #1eb959; text-decoration: none; }
.wa-inline:hover { text-decoration: underline; }
.contact-card { display: flex; align-items: center; gap: 14px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-top: 18px; flex-wrap: wrap; }
.wa-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(37,211,102,.14); color: #1eb959; display: grid; place-items: center; flex-shrink: 0; }
.contact-card > div:nth-child(2) { flex: 1; min-width: 180px; }
.contact-card strong { display: block; font-size: 14px; }
.contact-card span { font-size: 12.5px; color: var(--text-dim); }
.footer-links a { display: inline-flex; align-items: center; gap: 4px; }

.install-bar { display: flex; align-items: center; gap: 12px; background: var(--accent-soft); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; margin-top: 20px; }
.install-bar > svg { color: var(--accent); flex-shrink: 0; }
.install-bar > div { flex: 1; min-width: 0; }
.install-bar strong { display: block; font-size: 13px; }
.install-bar span { font-size: 12px; color: var(--text-dim); }

/* ---- mobile: results become cards, not a squeezed table ---- */
@media (max-width: 720px) {
  .main { padding: 18px 14px 32px; }
  .topbar h1 { font-size: 19px; }
  .top-actions { width: 100%; }
  .top-actions .primary-btn, .top-actions .secondary-btn { flex: 1; justify-content: center; }
  .search-row { flex-direction: column; }
  .search-btn { width: 100%; justify-content: center; padding: 12px; }
  .filters-panel { padding: 13px; }
  .date-filter { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
  .date-pill { white-space: nowrap; }
  .filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .select-box select { min-width: 0; width: 100%; }
  .clear-btn { grid-column: 1 / -1; margin-left: 0; justify-content: center; }
  .filter-grid.extra { grid-template-columns: 1fr; }
  .salary-filter { justify-content: space-between; } .salary-filter input[type=range] { flex: 1; width: auto; }

  table { min-width: 0; width: 100%; }
  thead { display: none; }
  tbody tr { display: block; border: 1px solid var(--border); border-radius: 12px; padding: 12px; margin-bottom: 10px; background: var(--surface); }
  tbody tr td { display: block; padding: 0; border: none; }
  tbody tr td:first-child { position: absolute; right: 22px; margin-top: 4px; }
  td .job-cell { margin-bottom: 8px; padding-right: 26px; }
  td .job-cell .job-title { font-size: 14.5px; white-space: normal; }
  /* Location / Posted / Experience / Salary / Easy Apply become a labelled grid */
  tbody tr td:nth-child(3), tbody tr td:nth-child(4), tbody tr td:nth-child(5),
  tbody tr td:nth-child(6), tbody tr td:nth-child(7) { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-dim); margin-right: 12px; margin-bottom: 4px; }
  tbody tr td:nth-child(3)::before { content: "📍"; } 
  tbody tr td:nth-child(5)::before { content: "Level:"; color: var(--text-faint); }
  tbody tr td:nth-child(6)::before { content: "Pay:"; color: var(--text-faint); }
  tbody tr td:last-child { margin-top: 10px; }
  .row-actions { width: 100%; }
  .row-actions .save-btn, .row-actions .view-btn { flex: 1; justify-content: center; padding: 9px; font-size: 12.5px; }
  .table-footer { flex-direction: column; align-items: stretch; gap: 12px; }
  .footer-right { justify-content: space-between; }
  .board { grid-template-columns: repeat(5, 80vw); scroll-snap-type: x mandatory; }
  .board-col { scroll-snap-align: start; }
  .stat-grid { grid-template-columns: 1fr 1fr; }
  .funnel-row { grid-template-columns: 92px 1fr 24px; }
  .app-footer { flex-direction: column; align-items: flex-start; gap: 12px; }
  .toast { flex-wrap: wrap; bottom: 12px; }
  .toast > div { flex-basis: 100%; }
  .drawer { width: 100%; border-radius: 16px 16px 0 0; }
  .modal.onboard { max-height: 88vh; }
}

@media (max-width: 880px) {
  .sidebar { position: fixed; z-index: 20; top: 0; bottom: 0; left: -260px; transition: left .2s; box-shadow: 0 0 0 9999px rgba(0,0,0,0); }
  .sidebar.open { left: 0; box-shadow: 0 0 0 9999px rgba(0,0,0,.35); }
  .mobile-menu { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); margin-right: 4px; }
  .topbar { flex-wrap: nowrap; }
}

/* ---- additions: banners, badges, chips, drawer, settings ---- */
.banner { margin-top: 14px; display: flex; align-items: flex-start; gap: 9px; background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); padding: 10px 13px; border-radius: 8px; font-size: 13px; color: var(--text); }
.banner svg:first-child { flex-shrink: 0; margin-top: 1px; color: var(--accent); }
.banner span { flex: 1; }
.banner > button { background: transparent; border: none; color: var(--text-dim); padding: 0; display: grid; place-items: center; }
.banner.error { border-left-color: #dc2626; background: #fff7f7; }
.banner.error svg:first-child { color: #dc2626; }
.loading-bar { height: 3px; background: var(--accent-soft); overflow: hidden; }
.loading-bar span { display: block; height: 100%; width: 35%; background: var(--accent); animation: slide 1.1s ease-in-out infinite; }
@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
.results-count { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.meta-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--chip); color: var(--text-dim); border-radius: 999px; padding: 2px 9px; font-size: 11.5px; }
.meta-badge.live { background: #ecfdf3; color: #15803d; }
.link-btn { display: inline-flex; align-items: center; gap: 4px; background: transparent; border: none; color: var(--accent); font-size: 12px; font-weight: 500; padding: 2px 6px; border-radius: 6px; }
.link-btn:hover { background: var(--accent-soft); }
.muted-note { color: #a7acc4; font-size: 12px; }
.chip { display: inline-block; background: var(--chip); color: var(--text-dim); border-radius: 999px; padding: 1px 8px; font-size: 11px; margin-left: 6px; }
.job-text { min-width: 0; }
button.job-title { background: transparent; border: none; padding: 0; text-align: left; font-size: 13px; cursor: pointer; font-family: inherit; }
tr.row-active { background: var(--accent-soft); }
.search-btn.cancel { background: #6b7280; }
.search-btn.cancel:hover { background: #4b5563; }
.api-card { width: 100%; background: var(--surface); text-align: left; cursor: pointer; font-family: inherit; }
.api-card:hover { border-color: #c7cbe0; }
.footer-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.page-size { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-dim); }
.page-size select { border: 1px solid var(--border); border-radius: 7px; padding: 4px 8px; font-size: 12.5px; background: var(--surface); color: var(--text); }
.pagination .ellipsis { padding: 0 4px; color: var(--text-dim); }
.panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.settings-block { border-top: 1px solid var(--border); padding-top: 18px; margin-top: 18px; }
.settings-block h3 { display: flex; align-items: center; gap: 7px; font-size: 14px; margin: 0 0 4px; }
.settings-block code { background: var(--chip); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
.settings-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.settings-form input { flex: 1 1 320px; border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 13.5px; font-family: inherit; background: var(--surface); color: var(--text); }
.settings-form input:focus { outline: none; border-color: var(--accent); }
.settings-row span.ok { color: #15803d; }
.secondary-btn.danger { color: #b91c1c; border-color: #fecaca; margin-top: 12px; }
.secondary-btn.danger:hover { background: #fef2f2; }
.icon-btn { background: transparent; border: 1px solid var(--border); border-radius: 8px; width: 34px; height: 34px; display: grid; place-items: center; color: var(--text-dim); flex-shrink: 0; }
.icon-btn:hover { color: var(--text); border-color: #c7cbe0; }
.drawer-backdrop { position: fixed; inset: 0; background: rgba(15, 18, 30, .35); z-index: 50; display: flex; justify-content: flex-end; }
.drawer { width: min(560px, 100%); height: 100%; background: var(--surface); box-shadow: -8px 0 30px rgba(0,0,0,.12); overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 18px; animation: slidein .18s ease-out; }
@keyframes slidein { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
.drawer-head { display: flex; align-items: flex-start; gap: 12px; }
.drawer-title { flex: 1; min-width: 0; }
.drawer-title h2 { font-size: 18px; margin: 0 0 6px; line-height: 1.3; }
.drawer-company { display: flex; flex-wrap: wrap; gap: 12px; color: var(--text-dim); font-size: 12.5px; }
.drawer-company span, .drawer-company a { display: inline-flex; align-items: center; gap: 4px; color: inherit; text-decoration: none; }
.drawer-company a:hover { color: var(--badge-text); }
.company-logo.big { width: 44px; height: 44px; font-size: 17px; border-radius: 10px; }
.drawer-facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.fact { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 9px 11px; display: flex; flex-direction: column; gap: 2px; }
.fact span { font-size: 11px; color: var(--text-dim); }
.fact strong { font-size: 13px; font-weight: 600; }
.drawer-section h4 { font-size: 13px; margin: 0 0 8px; }
.skill-list { display: flex; flex-wrap: wrap; gap: 6px; }
.skill-list .chip { margin: 0; padding: 4px 10px; font-size: 12px; }
.description { white-space: pre-line; font-size: 13.5px; line-height: 1.6; color: var(--text); margin: 0; }
.drawer-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); }
.drawer-actions .primary-btn { text-decoration: none; }
/* ---- account, alerts ---- */
.user-card { display: flex; align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: 10px; padding: 9px 10px; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: #fff; display: grid; place-items: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.user-text { min-width: 0; flex: 1; }
.user-text strong { display: block; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-text small { display: flex; align-items: center; gap: 4px; color: var(--text-dim); font-size: 11px; }
.icon-btn.small { width: 28px; height: 28px; }
.signin-btn { display: flex; align-items: center; gap: 8px; width: 100%; background: var(--accent-soft); color: var(--accent); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 12.5px; font-weight: 600; text-align: left; }
.signin-btn:hover { filter: brightness(1.06); }
.drawer-backdrop.center { align-items: center; justify-content: center; }
.modal { background: var(--surface); border-radius: 14px; width: min(440px, calc(100% - 32px)); padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,.2); display: flex; flex-direction: column; gap: 14px; }
.modal-head { display: flex; align-items: center; gap: 12px; }
.modal-head h2 { font-size: 17px; margin: 0 0 2px; }
.modal-head > div:nth-child(2) { flex: 1; }
.auth-status { font-size: 13px; color: var(--text-dim); margin: 0; line-height: 1.5; }
.auth-status.ok { color: #15803d; }
.auth-status.error { color: #b91c1c; }
.auth-fields { display: flex; flex-direction: column; gap: 10px; }
.auth-fields label { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--text-dim); }
.auth-fields input, .auth-fields select, .auth-fields textarea { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit; color: var(--text); background: var(--surface); resize: vertical; }
.auth-fields input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.auth-submit { justify-content: center; padding: 11px; font-size: 14px; }
.auth-links { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12.5px; color: var(--text-dim); }
.auth-links .link-btn { padding: 0; font-size: 12.5px; }
.auth-buttons { display: flex; flex-direction: column; gap: 6px; }
.signup-btn { display: flex; align-items: center; gap: 8px; width: 100%; background: var(--accent); color: #fff; border: 1px solid var(--accent); border-radius: 10px; padding: 10px 12px; font-size: 12.5px; font-weight: 600; text-align: left; }
.signup-btn:hover { background: var(--accent-hover); }
.alert-form { border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; background: var(--surface-2); }
.alert-form h3 { display: flex; align-items: center; gap: 7px; font-size: 14px; margin: 0 0 12px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.form-grid label { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--text-dim); }
.form-grid input, .form-grid select { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 13px; font-family: inherit; color: var(--text); background: var(--surface); }
.form-grid input:focus, .form-grid select:focus { outline: none; border-color: var(--accent); }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.alert-row.paused .alert-main { opacity: .55; }
.alert-main { min-width: 0; }
.secondary-btn.danger-inline { color: #b91c1c; }
.secondary-btn.danger-inline:hover { background: #fef2f2; border-color: #fecaca; }

/* ---- auth gate landing ---- */
.gate { font-family: 'Inter', system-ui, sans-serif; color: var(--text); min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; background: linear-gradient(135deg, var(--bg) 0%, var(--accent-soft) 100%); }
.gate * { box-sizing: border-box; }
.gate button { font-family: inherit; cursor: pointer; }
.gate-left { padding: clamp(28px, 6vw, 72px); display: flex; flex-direction: column; gap: 22px; justify-content: center; }
.gate-left h1 { font-size: clamp(26px, 3.2vw, 38px); line-height: 1.15; margin: 8px 0 0; letter-spacing: -0.01em; }
.gate-lead { font-size: 15px; line-height: 1.6; color: var(--text-dim); margin: 0; max-width: 52ch; }
.gate-steps { list-style: none; padding: 0; margin: 6px 0 0; display: flex; flex-direction: column; gap: 14px; }
.gate-steps li { display: flex; gap: 12px; align-items: flex-start; }
.gate-steps li div { display: flex; flex-direction: column; gap: 2px; }
.gate-steps strong { font-size: 14px; }
.gate-steps span:not(.step-num) { font-size: 13px; color: var(--text-dim); }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff; display: grid; place-items: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.gate-trust { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--text-dim); margin-top: 6px; }
.gate-right { display: flex; align-items: center; justify-content: center; padding: 28px; }
.gate-card { width: min(440px, 100%); box-shadow: 0 20px 60px rgba(79,70,229,.12); }
@media (max-width: 860px) { .gate { grid-template-columns: 1fr; } .gate-left { padding-bottom: 8px; } }
.modal.tour { text-align: center; align-items: center; }
.tour-icon { width: 60px; height: 60px; border-radius: 16px; background: var(--accent-soft); color: var(--accent); display: grid; place-items: center; }
.tour-dots { display: flex; gap: 6px; }
.tour-dots span { width: 7px; height: 7px; border-radius: 50%; background: #dcdcff; }
.tour-dots span.on { background: var(--accent); width: 18px; border-radius: 4px; }
.modal.tour h2 { font-size: 19px; margin: 4px 0 0; }
.modal.tour p { font-size: 14px; line-height: 1.6; color: var(--text-dim); margin: 0; max-width: 40ch; }
.modal.tour .form-actions { width: 100%; }
.pref-select { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 13px; background: #fff; font-family: inherit; }

/* ---- legal pages ---- */
.legal { font-family: 'Inter', system-ui, sans-serif; color: var(--text); background: var(--bg); min-height: 100vh; padding: 32px 16px 64px; }
.legal * { box-sizing: border-box; }
.legal button { font-family: inherit; cursor: pointer; }
.legal-inner { max-width: 760px; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: clamp(22px, 4vw, 44px); }
.legal h1 { font-size: 26px; margin: 16px 0 8px; }
.legal-intro { font-size: 14px; line-height: 1.7; color: var(--text-dim); margin: 0 0 22px; }
.legal h2 { font-size: 15px; margin: 22px 0 8px; }
.legal ul { margin: 0; padding-left: 20px; }
.legal li { font-size: 13.5px; line-height: 1.7; margin-bottom: 6px; }
.legal-switch { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 12.5px; }
.gate-legal { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; font-size: 12.5px; margin-top: 10px; }
.gate-legal .link-btn, .sidebar-legal .link-btn, .consent .link-btn { padding: 0; font-size: inherit; color: var(--accent); background: none; border: none; }
.sidebar-legal { font-size: 11.5px; color: var(--text-dim); padding: 0 4px; }
.consent { display: flex; gap: 9px; align-items: flex-start; font-size: 12.5px; color: var(--text-dim); line-height: 1.5; }
.consent input { margin-top: 3px; }

/* ---- filters extra, tracker, board, admin, company ---- */
.filter-grid.extra { border-top: 1px dashed var(--border); padding-top: 12px; align-items: center; gap: 18px; }
.check-filter { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text); cursor: pointer; }
.salary-filter { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-dim); }
.salary-filter .mono { font-variant-numeric: tabular-nums; color: var(--text); min-width: 34px; }
.salary-filter input[type=range] { width: 160px; accent-color: var(--accent); }
.meta-badge.warn { background: #fff4e5; color: #b45309; }
.banner.warn { border-left-color: #d97706; background: #fffaf0; }
.banner.warn svg:first-child { color: #d97706; }
.chip.hot { background: #ecfdf3; color: #15803d; display: inline-flex; align-items: center; gap: 3px; }
.chip.status.saved { background: #eef0ff; color: var(--accent); } .chip.status.applied { background: #e0f2fe; color: #0369a1; } .chip.status.interviewing { background: #fef3c7; color: #b45309; } .chip.status.offer { background: #dcfce7; color: #15803d; } .chip.status.rejected { background: #fee2e2; color: #b91c1c; }
.company-link { background: none; border: none; padding: 0; font: inherit; color: var(--text-dim); cursor: pointer; }
.company-link:hover { color: var(--badge-text); text-decoration: underline; }
.view-toggle { display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.view-toggle button { display: flex; align-items: center; gap: 5px; background: var(--surface); border: none; padding: 6px 10px; font-size: 12.5px; color: var(--text-dim); }
.view-toggle button.on { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.board { display: grid; grid-template-columns: repeat(5, minmax(200px, 1fr)); gap: 12px; margin-top: 12px; overflow-x: auto; padding-bottom: 6px; }
.board-col { background: var(--surface-2); border-radius: 12px; padding: 10px; min-height: 260px; display: flex; flex-direction: column; gap: 8px; }
.board-head { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; padding: 2px 4px 6px; }
.board-count { margin-left: auto; background: var(--surface); border-radius: 999px; padding: 0 7px; font-size: 11px; color: var(--text-dim); }
.status-dot-sm { width: 8px; height: 8px; border-radius: 50%; }
.status-dot-sm.saved { background: var(--accent); } .status-dot-sm.applied { background: #0284c7; } .status-dot-sm.interviewing { background: #d97706; } .status-dot-sm.offer { background: #16a34a; } .status-dot-sm.rejected { background: #dc2626; }
.board-card { background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 10px; cursor: grab; display: flex; flex-direction: column; gap: 3px; font-size: 12.5px; }
.board-card:hover { border-color: var(--text-faint); box-shadow: 0 2px 8px var(--shadow); }
.board-card strong { font-size: 13px; } .board-card > span { color: var(--text-dim); font-size: 12px; }
.board-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; font-size: 11px; color: var(--text-dim); }
.board-meta span { display: inline-flex; align-items: center; gap: 3px; } .board-meta .due { color: #b45309; font-weight: 600; }
.board-empty { border: 1px dashed var(--border); border-radius: 8px; padding: 18px; text-align: center; font-size: 12px; color: #a7acc4; }
.tracker { background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.tracker h4 { display: flex; align-items: center; gap: 6px; }
.tracker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.tracker-grid label, .tracker-notes { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--text-dim); }
.tracker-grid select, .tracker-grid input, .tracker-notes textarea { border: 1px solid var(--border); border-radius: 7px; padding: 7px 9px; font-size: 13px; font-family: inherit; color: var(--text); background: var(--surface); }
.tracker-notes { margin-top: 10px; } .tracker-notes textarea { resize: vertical; }
.company-role { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 10px 0; border-top: 1px solid var(--border); }
.company-logo.img { object-fit: contain; background: var(--surface); border: 1px solid var(--border); }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; margin-bottom: 16px; }
.stat { background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; }
.stat span { font-size: 11.5px; color: var(--text-dim); } .stat strong { font-size: 20px; } .stat small { font-size: 11.5px; color: var(--text-dim); }
.chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
.chart-card { border: 1px solid var(--border); border-radius: 10px; padding: 12px; } .chart-card h3 { font-size: 13px; margin: 0 0 8px; }
.admin-table { min-width: 600px; } .admin-table th, .admin-table td { font-size: 12.5px; padding: 8px 10px; }
.secondary-btn.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.captcha { min-height: 65px; }

/* ---- plans, progress, job page ---- */
.banner.upgrade { border-left-color: #b45309; background: #fffbeb; align-items: center; }
.banner.upgrade svg:first-child { color: #b45309; }
.primary-btn.small-btn { padding: 6px 11px; font-size: 12.5px; }
.progress-strip { display: flex; align-items: center; gap: 7px; padding: 8px 14px; background: var(--accent-soft); color: var(--accent); font-size: 12.5px; }
.mono { font-variant-numeric: tabular-nums; }
.plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.plan { border: 1px solid var(--border); border-radius: 14px; padding: 22px; position: relative; display: flex; flex-direction: column; gap: 12px; }
.plan.pro { border-color: var(--accent); box-shadow: 0 10px 30px rgba(79,70,229,.10); }
.plan.current { background: var(--surface-2); }
.plan h3 { margin: 0; font-size: 18px; }
.price { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; }
.price span { font-size: 13px; font-weight: 500; color: var(--text-dim); } .price small { font-size: 13px; font-weight: 500; color: var(--text-dim); margin-left: 6px; }
.plan ul { list-style: none; padding: 0; margin: 4px 0 8px; display: flex; flex-direction: column; gap: 8px; }
.plan li { display: flex; align-items: center; gap: 8px; font-size: 13.5px; } .plan li svg { color: #15803d; flex-shrink: 0; }
.plan-badge { position: absolute; top: -11px; left: 18px; background: var(--accent); color: #fff; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
.plan-current { font-size: 12.5px; color: #15803d; font-weight: 600; }
.plan-actions { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
.plan-actions .primary-btn, .plan-actions .secondary-btn { justify-content: center; }
.jobpage .drawer-actions { flex-wrap: wrap; margin-top: 20px; }
.jobpage-cta { margin-top: 18px; background: var(--accent-soft); border-radius: 10px; padding: 12px 14px; font-size: 13px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; color: var(--text); }
.jobpage-cta .link-btn { padding: 0; font-size: 13px; }

/* ---- theme toggle, footer, dashboard, toast ---- */
.theme-toggle { display: flex; align-items: center; gap: 8px; width: 100%; background: transparent; border: 1px solid var(--border); border-radius: 10px; padding: 9px 12px; font-size: 12.5px; color: var(--text-dim); }
.theme-toggle:hover { background: var(--hover); color: var(--text); }
.app-footer { margin-top: 34px; padding-top: 18px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; font-size: 12px; color: var(--text-dim); }
.app-footer strong { display: block; font-size: 12.5px; color: var(--text); }
.app-footer span { font-size: 11.5px; }
.footer-founder { display: flex; align-items: center; gap: 9px; }
.footer-founder a { color: var(--badge-text); text-decoration: none; display: inline-flex; align-items: center; gap: 3px; }
.avatar.sm { width: 26px; height: 26px; font-size: 11px; }
.footer-links { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.footer-links a { color: var(--text-dim); text-decoration: none; }
.footer-links a:hover, .footer-links .link-btn:hover { color: var(--accent); }
.footer-links .link-btn { padding: 0; font-size: 12px; color: var(--text-dim); }
.chart-card h3 { display: flex; align-items: center; gap: 6px; }
.funnel { display: flex; flex-direction: column; gap: 10px; padding: 6px 0; }
.funnel-row { display: grid; grid-template-columns: 110px 1fr 28px; align-items: center; gap: 10px; font-size: 12.5px; }
.funnel-label { display: flex; align-items: center; gap: 7px; color: var(--text-dim); }
.funnel-bar { height: 8px; background: var(--chip); border-radius: 999px; overflow: hidden; }
.funnel-bar .fill { display: block; height: 100%; border-radius: 999px; transition: width .3s; }
.fill.saved { background: var(--accent); } .fill.applied { background: #0284c7; } .fill.interviewing { background: #d97706; } .fill.offer { background: #16a34a; } .fill.rejected { background: #dc2626; }
.funnel-row strong { text-align: right; font-variant-numeric: tabular-nums; }
.chip.viewed { background: var(--accent-soft); color: var(--accent); }
.view-btn.opened { background: transparent; color: var(--success); border-color: var(--success); }
.view-btn.opened:hover { background: transparent; filter: brightness(1.1); }
.toast { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 60; display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; box-shadow: 0 12px 40px var(--shadow); max-width: calc(100% - 32px); animation: slideup .2s ease-out; }
@keyframes slideup { from { transform: translate(-50%, 16px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
.toast > svg { color: var(--accent); flex-shrink: 0; }
.toast strong { display: block; font-size: 13px; } .toast span { font-size: 12px; color: var(--text-dim); }
.toast > div { flex: 1; min-width: 0; }
.toast .secondary-btn, .toast .primary-btn { padding: 7px 12px; font-size: 12.5px; white-space: nowrap; }

/* ---- retention features ---- */
.chip.new { background: #dcfce7; color: #15803d; display: inline-flex; align-items: center; gap: 3px; font-weight: 600; }
[data-theme="dark"] .chip.new { background: #14331f; color: #4ade80; }
.hide-menu { position: relative; display: inline-flex; }
.icon-btn.tiny { width: 28px; height: 28px; }
.hide-pop { display: none; position: absolute; right: 0; top: calc(100% + 4px); z-index: 20; background: var(--surface); border: 1px solid var(--border); border-radius: 9px; box-shadow: 0 8px 24px var(--shadow); padding: 4px; min-width: 190px; }
.hide-menu:hover .hide-pop, .hide-menu:focus-within .hide-pop { display: block; }
.hide-pop button { display: flex; align-items: center; gap: 8px; width: 100%; background: transparent; border: none; padding: 8px 10px; border-radius: 6px; font-size: 12.5px; color: var(--text); text-align: left; }
.hide-pop button:hover { background: var(--hover); }
.filter-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
.filter-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--chip); border-radius: 999px; padding: 5px 6px 5px 11px; font-size: 12px; color: var(--text-dim); }
.filter-chip button { background: transparent; border: none; color: var(--text-faint); display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; }
.filter-chip button:hover { background: var(--border); color: var(--text); }
.tracker-grid input[type=datetime-local] { color-scheme: light; }
[data-theme="dark"] .tracker-grid input[type=datetime-local], [data-theme="dark"] .tracker-grid input[type=date] { color-scheme: dark; }

@media (prefers-reduced-motion: reduce) { .drawer, .loading-bar span, .spin { animation: none; } }
`;

createRoot(document.getElementById("root")).render(<App />);