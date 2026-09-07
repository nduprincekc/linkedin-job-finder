# LinkedIn Job Wire

A focused React dashboard for searching LinkedIn job listings, filtering by post date, and exporting results to CSV.

## Features

- Keyword + location search, LinkedIn-only by design
- Date-posted filter: Any time, 24 hours, 3 days, 7 days, 30 days
- Experience level, job type, and Easy Apply filters
- Sort by most recent, company, or salary
- Select individual rows or the whole page; export selected or export all as CSV
- Save roles to a "Saved" tab (persisted via the app's storage)
- Client-side pagination
- Runs entirely on demo data out of the box — no backend required
- Optional n8n webhook integration for live data

## Run locally

Requirements: Node.js 18+.

```bash
npm install
npm run dev
```

Open the local Vite URL printed in the terminal.

## Connect a real data source (n8n)

This UI does not scrape LinkedIn itself — it's a front end for whatever compliant data source you point it at.

1. In n8n, create a Webhook node (POST) that runs your job-search workflow and returns JSON.
2. Copy `.env.example` to `.env` and set:
   ```env
   VITE_N8N_WEBHOOK_URL=https://your-n8n-domain/webhook/linkedin-job-search
   ```
3. Restart `npm run dev`.

**Request sent to your webhook:**
```json
{
  "source": "linkedin",
  "query": "AI automation engineer",
  "location": "Remote",
  "dateRange": "7d",
  "experience": "all",
  "jobType": "all",
  "easyApply": "all"
}
```

**Expected response** — either a bare array or `{ "jobs": [...] }`, with objects shaped like:
```json
{
  "id": "123",
  "title": "AI Automation Engineer",
  "company": "Example Co",
  "location": "Remote",
  "posted": "2h ago",
  "ageHours": 2,
  "experience": "Mid-Senior",
  "salary": "$100K–$140K",
  "type": "Full-time",
  "remote": true,
  "easyApply": true,
  "url": "https://www.linkedin.com/jobs/view/123"
}
```

### Suggested n8n architecture

```
Webhook
  → validate search params
  → LinkedIn-compliant job data provider
  → normalize fields (title, company, location, posted date, salary, url)
  → filter by dateRange
  → dedupe by job URL / job ID
  → return JSON
```

Keep the source LinkedIn-compliant — don't bypass LinkedIn's authentication, CAPTCHAs, rate limits, or access controls. If you're already running an Apify-based scraper (as in the JobRight/JobberMan feed), swap in a LinkedIn-approved actor or dataset and reuse the same normalize → filter → dedupe pattern.

## Before a real launch

- Persist users, saved jobs, and search history in a real database (e.g. Supabase)
- Add authentication
- Move pagination and search to the server
- Cache repeat searches
- Schedule refreshes in n8n instead of searching on demand
- Rate-limit and set usage quotas
- Add job alerts by email or Telegram
- Track search analytics
