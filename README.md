# 🧩 LeetCode Roadmap

A local desktop app that mirrors the [NeetCode 150 roadmap](https://neetcode.io/roadmap) and syncs your solved/attempted status directly from your LeetCode account — no third-party accounts, no cloud, no tracking.

> **Windows only.** Runs as a standalone `.exe` — no Node.js or npm required to use it.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Auto-sync** | Connects to your LeetCode account via your session cookie and marks every problem you've solved or attempted |
| **NeetCode 150** | All 150 problems grouped by topic and learning phase, with difficulty badges and premium markers |
| **Grid & Tree views** | Toggle between a card grid (all topics at a glance) and a dependency-graph roadmap view |
| **Custom Roadmaps** | Build unlimited personal roadmaps from any LeetCode problems — paste URLs, or import a whole company/study-plan list |
| **Import collections** | Supports company lists (`amazon-all`), study plans (`top-interview-150`), and personal lists (`selectedList=…`) |
| **100% local** | Your session cookie never leaves your machine — the app is a local proxy between the browser and LeetCode |
| **No login / no account** | Just paste your `LEETCODE_SESSION` cookie once; it's saved in your browser's `localStorage` |

---

## 🚀 Quick Start

### Option A — Download the exe (recommended)

1. Go to [**Releases**](../../releases/latest) and download `LeetCode Roadmap.exe`
2. Place it in a folder (e.g. `C:\Tools\LeetCode Roadmap\`) — the `dist\` folder must stay next to the exe
3. Double-click `LeetCode Roadmap.exe` — it starts the server and opens your browser automatically

### Option B — Run from source

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/leetcode-roadmap.git
cd leetcode-roadmap

# 2. Install dependencies
npm install
npm --prefix frontend install

# 3. Build the frontend
npm run build:frontend   # outputs to release/dist/

# 4. Start (dev mode — hot-reloads the frontend)
npm run dev
```

Then open [http://localhost:3001](http://localhost:3001).

---

## 🔑 Connecting Your LeetCode Account

The app walks you through it on first launch, but here's the gist:

1. Click **Open LeetCode ↗** and sign in to your account
2. Press **F12** → **Application** tab → **Cookies** → `https://leetcode.com`
3. Find the row named `LEETCODE_SESSION` and copy its value
4. Paste it into the app and click **Connect & Sync →**

Your cookie is stored only in `localStorage` and is only ever sent to `leetcode.com` through the local proxy. It is **never** sent anywhere else.

Sync happens automatically every 30 minutes while the app is open, or you can hit the **↻ Sync** button in the header at any time.

---

## 📦 Custom Roadmaps

Hit the **+ New** tab button to open the roadmap builder:

### Paste problem links
Drop in LeetCode URLs or slugs (one per line) — tags are fetched automatically:
```
https://leetcode.com/problems/two-sum/
https://leetcode.com/problems/house-robber/
maximum-subarray
word-break
```

### Import a collection URL
Paste any of these LeetCode URL formats:

| Format | Example |
|---|---|
| Company list | `https://leetcode.com/company/amazon/?favoriteSlug=amazon-all` |
| Study plan | `https://leetcode.com/studyPlan/top-interview-150/?favoriteSlug=top-interview-150` |
| Personal list | `https://leetcode.com/list?selectedList=abc123` |
| Bare slug | `amazon-all` |

Problems are automatically categorised into the same topics as the NeetCode 150 and your solved/attempted status is shown live.

---

## 🏗️ Building the exe

Requires Node.js 18+ and [`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg).

```bash
# Build frontend first
npm run build:frontend

# Then package the server + frontend into a single exe
npm run build:exe
```

The output is `release/LeetCode Roadmap.exe` (≈42 MB). The `release/dist/` folder must sit next to it at runtime.

---

## 🛠️ Tech Stack

- **Frontend** — React 18, Vite, Tailwind CSS
- **Backend** — Express (local proxy, port 3001)
- **Packaging** — `@yao-pkg/pkg` (bundles Node.js + server into a single Windows exe)
- **Data source** — LeetCode's unofficial REST and GraphQL APIs

---

## 🔒 Security & Privacy

- **No hardcoded keys** — the app has zero API keys or secrets in the source
- **No external services** — all traffic goes directly to `leetcode.com`
- **Session cookie stays local** — stored in your browser's `localStorage`, only sent to `leetcode.com` via `localhost:3001`
- **Open source** — read every line of `server.js` and `frontend/src/` yourself

---

## 📁 Project Structure

```
leetcode-roadmap/
├── server.js                  # Express proxy (CSRF refresh, /api/solved, /api/tags, /api/list)
├── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Root — tabs, custom roadmap state
│   │   ├── data/
│   │   │   ├── roadmap.js     # All 150 NeetCode problems + topic metadata
│   │   │   └── graphLayout.js # Node positions for the tree view
│   │   ├── hooks/
│   │   │   └── useLeetCode.js # Sync hook — REST /api/problems/all/
│   │   └── components/
│   │       ├── CookieSetup.jsx   # First-run onboarding
│   │       ├── Header.jsx        # Nav, view toggle, sync button
│   │       ├── Roadmap.jsx       # Grid layout + progress banner
│   │       ├── TopicSection.jsx  # Expandable topic card
│   │       ├── TreeView.jsx      # SVG dependency graph
│   │       ├── ProblemPanel.jsx  # Side panel (tree view)
│   │       └── ImportModal.jsx   # Custom roadmap builder
│   └── ...
└── release/                   # Built output (gitignored)
    ├── LeetCode Roadmap.exe
    └── dist/
```

---

## Contributing

PRs welcome. The codebase is intentionally small — all server logic lives in `server.js` and all UI in `frontend/src/`.

---

## License

MIT
