# GH-Dashboard

A personal, **read-only** GitHub developer dashboard. Shows your PRs, the merge queue, notifications, contribution heatmap, and achievement badges. Pure static HTML — no backend, no build step, no dependencies.

## Live

`https://<your-github-username>.github.io/Dashboard`

---

## Security model — read this first

This dashboard is intentionally **view-only**. It cannot close PRs, push code, modify notifications, or take any action on your behalf — by design.

### What this means for your token

You should give it a **fine-grained, read-only** Personal Access Token, scoped to only the repositories you want to see. If that token ever leaks, an attacker can read what you can read in those specific repos — and **nothing else**. They cannot:

- Force-push to `main` or any branch
- Delete repositories
- Close, reopen, or merge PRs
- Modify notification subscriptions
- Touch repos outside the ones you scoped the token to

### Required token permissions

Create one at [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new):

| Section | Permission | Access |
|---|---|---|
| Repository | Contents | Read |
| Repository | Pull requests | Read |
| Repository | Issues | Read |
| Repository | Metadata | Read (mandatory) |
| Account | Notifications | Read |

Select only the repos you want the dashboard to monitor. **Do not grant any `Write` permissions** — the dashboard does not use them.

### Where the token lives

- **Only in your browser's `localStorage`** — never sent to any backend
- **Origin-scoped**: only your browser, on your specific dashboard URL, can read it
- **Never committed**: the token is not in this repo and never will be
- All API calls go directly from your browser to `api.github.com` over HTTPS

### What this does NOT protect against

To be honest about the limits:

- **XSS in this page itself** would expose the token. The dashboard avoids `eval`, loads no third-party scripts, uses a strict CSP, and `esc()`s user content — but no client-side app is XSS-proof
- **Malware on your laptop** can read browser memory regardless of where a token lives
- **A compromised browser extension** with `<all_urls>` permissions can read `localStorage`

For a personal dev tool with a read-only token scoped to your own repos, this threat profile is acceptable. For higher-stakes use, fork it and put a real backend in front (proxy + OAuth Device Flow).

### Want to clear your token?

Click **Settings → Clear saved** to wipe credentials from `localStorage`. Or revoke the token at <https://github.com/settings/personal-access-tokens>.

---

## Setup

```bash
git clone https://github.com/<you>/Dashboard.git
cd Dashboard
```

### Option A — GitHub Pages (zero infra)

1. **Settings → Pages → Deploy from a branch → `main` / root**
2. Visit `https://<you>.github.io/Dashboard`
3. Click **Settings**, paste your fine-grained read-only PAT, save

### Option B — Local Docker

```bash
docker compose up -d
# → http://localhost:3000
```

Local Docker also enables the **achievements badge scrape** (a small nginx proxy that fetches your `?tab=achievements` page server-side, since GitHub's CORS blocks browser fetches). Pages-hosted version skips this.

---

## Features

- **Pull requests** — authored PRs with merge readiness (review state, CI status, draft, conflicts)
- **Merge queue** — live entries from GitHub's merge queue (per repo) via GraphQL
- **Notifications** — only events on PRs *you authored* (filtered server-side after fetch)
- **Contribution heatmap** — last 12 weeks via the GraphQL `contributionsCollection` API (matches your GitHub profile exactly)
- **Achievements** — your earned GitHub achievement badges (local Docker only)
- **Streak counter** — current consecutive days with contributions

---

## What the dashboard reads

| Endpoint | Why |
|---|---|
| `GET /search/issues` | List your open PRs |
| `GET /repos/:o/:r/pulls/:n/reviews` | Compute merge readiness |
| `GET /notifications` | List notifications |
| `GET /repos/:o/:r/pulls/:n` | Verify PR author = you |
| `POST /graphql` | Heatmap, merge queue, contribution stats |

All read-only. No `PATCH`, `PUT`, `POST` (other than GraphQL queries), or `DELETE`.

---

## License

MIT.
