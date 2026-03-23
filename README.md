# Dev Dashboard

A personal developer dashboard showing your GitHub PRs, CI status, notifications, and service statuses — hosted on GitHub Pages, zero backend.

## Live

Once deployed: `https://<your-github-username>.github.io/Dashboard`

---

## Setup

### 1. Fork or clone this repo

```bash
git clone https://github.com/<you>/Dashboard.git
cd Dashboard
```

### 2. Enable GitHub Pages

- Go to **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: `main` / root (`/`)
- Save — your site will be live in ~60 seconds

### 3. Get a GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens?type=beta)
2. Create a **fine-grained** token with **read-only** access to:
   - **Pull requests** — to show your PRs
   - **Actions** — to show CI status
   - **Metadata** — required by GitHub
3. Or use a classic token with `repo` + `notifications` scopes
4. If your org uses SAML SSO, click **Configure SSO** next to the token

### 4. Enter your token in the dashboard

Open the dashboard, click **Settings**, paste your token, and click **Save & Load**.

---

## Credential safety

| What | Where | Committed? |
|---|---|---|
| GitHub PAT | Browser `localStorage` only (if you tick "Remember") | **Never** |
| Settings | Browser `localStorage` only | **Never** |

- Your token is stored **entirely in your browser** — it is never sent to any backend server
- All API calls go directly from your browser to `api.github.com`
- `localStorage` is origin-scoped: only your browser on your specific GitHub Pages URL can read it
- Untick "Remember" and click **Clear saved** at any time to wipe credentials
- Use a **fine-grained token** with minimal read-only scopes for best security

---

## Features

- **Pull Requests** — authored, review requested, assigned tabs
- **Notifications** — unread PR notifications from GitHub
- **CI Status** — GitHub Actions workflow runs for watched repos
- **Service Statuses** — monitor GitHub, npm, Vercel, Cloudflare, Slack, AWS, Microsoft 365
- **Custom Services** — add your own Statuspage-compatible services
- **Theme** — light, dark, or system preference
- **Fully client-side** — no server, no build step, no dependencies

---

## Local development

No build step needed — just open `index.html`:

```bash
open index.html
# or
npx serve .
```

---

## Docker (optional)

For local Docker hosting:

```bash
docker compose up -d
# → http://localhost:3000
```
