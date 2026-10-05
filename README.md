# GH-Dashboard

A personal, **read-only** GitHub developer dashboard. Shows your PRs, the merge queue, notifications, contribution heatmap, and achievement badges. Pure static HTML — no backend, no build step, no dependencies.

## Live

`https://<your-github-username>.github.io/Dashboard`

---

## Security model — read this first

This dashboard is **read-mostly**. It has exactly two write actions, both triggered only by an explicit click: **Close** (closes a PR, after a confirm dialog) and **Watch/Unwatch** (sets your GitHub subscription on a PR). Nothing writes in the background.

With the read-only token below, both write actions fail safely: Close shows an error, and Unwatch falls back to hiding the PR's notifications in this dashboard only. To enable them, use the auth broker (Option C) or add `Pull requests: Write` to the token.

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

Select only the repos you want the dashboard to monitor. Grant `Write` only if you want the Close and Watch buttons to work — everything else needs `Read` only.

### Where the token lives

- **Only in your browser's `localStorage`** — never sent to any backend
- **Origin-scoped**: only your browser, on your specific dashboard URL, can read it
- **Never committed**: the token is not in this repo and never will be
- All API calls go directly from your browser to `api.github.com` over HTTPS (or, with the auth broker, through it — see Option C)

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

### Option C — Local Docker + auth broker (token never in the browser)

```bash
node auth-broker.js      # proxies GitHub calls with the token from `gh auth token`
node notify-helper.js    # optional: native macOS notifications
docker compose up -d
```

Both helpers listen on `127.0.0.1` only and reject any request that lacks the `X-Dashboard: 1` header or has an unexpected `Host`. The custom header forces a CORS preflight, so other websites open in your browser cannot send requests through the broker with your `gh` token.

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

Writes, only on an explicit click:

| Endpoint | Why |
|---|---|
| `PATCH /repos/:o/:r/pulls/:n` | **Close** button (after confirmation) |
| `PUT /repos/:o/:r/issues/:n/subscription` | **Watch/Unwatch** button |

---

## License

MIT.
