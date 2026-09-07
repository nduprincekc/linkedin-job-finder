import { createClient } from "@supabase/supabase-js";

const url = import.meta.env?.VITE_SUPABASE_URL || "";
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

export const supabaseEnabled = Boolean(url && anonKey);
export const supabase = supabaseEnabled ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

/* ---- auth helpers ---- */
export const auth = {
  signUp: (email, password, fullName, captchaToken, phone, whatsappOptin) => supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, phone: phone || null, whatsapp_optin: Boolean(whatsappOptin), accepted_terms_at: new Date().toISOString(), terms_version: "1.0" }, captchaToken: captchaToken || undefined, emailRedirectTo: `${window.location.origin}/?verified=1` }
  }),
  signIn: (email, password, captchaToken) => supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captchaToken || undefined } }),
  resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/?reset=1` }),
  updatePassword: (password) => supabase.auth.updateUser({ password }),
  resendConfirmation: (email) => supabase.auth.resend({ type: "signup", email }),
  signOut: () => supabase.auth.signOut(),
  signOutEverywhere: () => supabase.auth.signOut({ scope: "global" }),
  getAccessToken: async () => (await supabase.auth.getSession()).data.session?.access_token || "",
  deleteAccount: () => supabase.rpc("delete_own_account")
};

/* ---- data helpers (all scoped to the signed-in user by RLS) ---- */
export const db = {
  async getProfile() {
    const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
    if (error) throw error;
    return data;
  },
  async updateProfile(userId, patch) {
    const { data, error } = await supabase.from("profiles").upsert({ id: userId, ...patch, updated_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return data;
  },
  async listSaved() {
    const { data, error } = await supabase.from("saved_jobs").select("job_key, job, status, notes, applied_at, follow_up_at, cv_version, recruiter_name, recruiter_email, interview_at, interview_note, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(r => ({ ...r.job, savedAt: r.created_at, status: r.status || "saved", notes: r.notes || "", appliedAt: r.applied_at, followUpAt: r.follow_up_at, cvVersion: r.cv_version || "", recruiterName: r.recruiter_name || "", recruiterEmail: r.recruiter_email || "", interviewAt: r.interview_at, interviewNote: r.interview_note || "" }));
  },
  async saveJob(userId, job, jobKey) {
    const { error } = await supabase.from("saved_jobs").upsert({ user_id: userId, job_key: jobKey, job }, { onConflict: "user_id,job_key" });
    if (error) throw error;
  },
  async unsaveJob(jobKey) {
    const { error } = await supabase.from("saved_jobs").delete().eq("job_key", jobKey);
    if (error) throw error;
  },
  async updateSaved(jobKey, patch) {
    const { error } = await supabase.from("saved_jobs").update(patch).eq("job_key", jobKey);
    if (error) throw error;
  },
  async usageToday() {
    const { data, error } = await supabase.rpc("my_usage_today");
    if (error) throw error;
    return data;
  },
  async adminStats(days = 14) {
    const { data, error } = await supabase.rpc("admin_stats", { days });
    if (error) throw error;
    return data;
  },
  async touchLastSeen() {
    const { data, error } = await supabase.rpc("touch_last_seen");
    if (error) throw error;
    return data;                     // the PREVIOUS visit timestamp
  },
  async saveOnboarding(userId, patch) {
    const { data, error } = await supabase.from("profiles").update({ ...patch, onboarded_at: new Date().toISOString() }).eq("id", userId).select().single();
    if (error) throw error;
    return data;
  },
  async listFilters() {
    const { data, error } = await supabase.from("user_filters").select("id, kind, value, label").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async addFilter(userId, kind, value, label) {
    const { data, error } = await supabase.from("user_filters").upsert({ user_id: userId, kind, value, label }, { onConflict: "user_id,kind,value" }).select().single();
    if (error) throw error;
    return data;
  },
  async removeFilter(id) {
    const { error } = await supabase.from("user_filters").delete().eq("id", id);
    if (error) throw error;
  },
  async setEmailPrefs(userId, patch) {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().single();
    if (error) throw error;
    return data;
  },
  async listSavedSearches() {
    const { data, error } = await supabase.from("saved_searches").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createSavedSearch(userId, name, params) {
    const { data, error } = await supabase.from("saved_searches").insert({ user_id: userId, name, params }).select().single();
    if (error) throw error;
    return data;
  },
  async deleteSavedSearch(id) {
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (error) throw error;
  },
  async getSearchRun(id) {
    const { data, error } = await supabase.from("search_runs").select("id,status,stage,count,results,error,from_cache,created_at,finished_at").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
  async getJob(id) {
    const { data, error } = await supabase.from("jobs").select("id, job, first_seen").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? { ...data.job, id: data.id, firstSeen: data.first_seen } : null;
  },
  async listPayments() {
    const { data, error } = await supabase.from("payments").select("provider, reference, amount, currency, status, created_at").order("created_at", { ascending: false }).limit(10);
    if (error) throw error;
    return data;
  },
  async listSearches(limit = 20) {
    const { data, error } = await supabase.from("searches").select("params, result_count, created_at").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data.map(r => ({ ...r.params, resultCount: r.result_count, at: r.created_at }));
  },
  async logSearch(userId, params, resultCount) {
    const { error } = await supabase.from("searches").insert({ user_id: userId, params, result_count: resultCount });
    if (error) throw error;
  },
  async listAlerts() {
    const { data, error } = await supabase.from("job_alerts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createAlert(userId, alert) {
    const { data, error } = await supabase.from("job_alerts").insert({ user_id: userId, ...alert }).select().single();
    if (error) throw error;
    return data;
  },
  async updateAlert(id, patch) {
    const { data, error } = await supabase.from("job_alerts").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteAlert(id) {
    const { error } = await supabase.from("job_alerts").delete().eq("id", id);
    if (error) throw error;
  }
};