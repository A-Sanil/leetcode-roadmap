const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

// When packaged as an exe with pkg, __dirname is inside the snapshot (read-only virtual FS)
// and express.static/sendFile's underlying fs.stat calls fail on it.
// Fix: keep dist/ next to the exe on the real filesystem and resolve it from process.execPath.
const distPath = process.pkg
  ? path.join(path.dirname(process.execPath), 'dist')
  : path.join(__dirname, 'dist');

app.use(express.static(distPath));

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';
let cachedCsrf = null;

async function refreshCsrf() {
  try {
    const res = await fetch('https://leetcode.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const cookies = res.headers.raw()['set-cookie'] || [];
    for (const c of cookies) {
      const m = c.match(/csrftoken=([^;]+)/);
      if (m) { cachedCsrf = m[1]; break; }
    }
    if (cachedCsrf) console.log('[csrf] refreshed');
  } catch (e) {
    console.error('[csrf] refresh failed:', e.message);
  }
}

refreshCsrf();
setInterval(refreshCsrf, 60 * 60 * 1000);

// Allow CORS for the browser extension (origin is "chrome-extension://…")
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Extension one-click connect: validate session then store it in the app's session store
app.post('/api/connect', async (req, res) => {
  const { session } = req.body;
  if (!session) return res.status(400).json({ error: 'session required' });

  const cookieStr = cachedCsrf
    ? `LEETCODE_SESSION=${session}; csrftoken=${cachedCsrf}`
    : `LEETCODE_SESSION=${session}`;

  try {
    const r = await fetch('https://leetcode.com/api/problems/all/', {
      headers: {
        Cookie: cookieStr,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://leetcode.com/',
        Accept: 'application/json',
      },
    });
    if (!r.ok) return res.status(r.status).json({ error: `LeetCode returned ${r.status}` });
    const data = await r.json();
    if (!data.user_name) return res.status(401).json({ error: 'Session invalid or expired' });

    // Store session in a server-side variable so the frontend can read it on load
    pendingSession = { session, username: data.user_name, storedAt: Date.now() };
    console.log(`[connect] extension connected: ${data.user_name}`);
    res.json({ username: data.user_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Extension disconnect
app.post('/api/disconnect', (req, res) => {
  pendingSession = null;
  res.json({ ok: true });
});

// Frontend polls this to pick up the session the extension just pushed
app.get('/api/pending-session', (req, res) => {
  if (pendingSession) {
    const s = pendingSession;
    pendingSession = null; // consume it
    res.json(s);
  } else {
    res.json(null);
  }
});

let pendingSession = null;

// Primary sync endpoint — uses LeetCode's REST problems list, which reliably
// returns per-user solved status. The GraphQL questionList.status field silently
// returns null when CSRF isn't fully validated, making problems appear unsolved.
app.post('/api/solved', async (req, res) => {
  const { session } = req.body
  if (!session) return res.status(401).json({ error: 'No session provided' })

  const cookieStr = cachedCsrf
    ? `LEETCODE_SESSION=${session}; csrftoken=${cachedCsrf}`
    : `LEETCODE_SESSION=${session}`

  try {
    const r = await fetch('https://leetcode.com/api/problems/all/', {
      headers: {
        Cookie: cookieStr,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://leetcode.com/',
        Accept: 'application/json',
      },
    })

    if (!r.ok) return res.status(r.status).json({ error: `LeetCode returned ${r.status}` })
    const data = await r.json()

    if (!data.user_name) {
      return res.status(401).json({
        error: 'Session invalid or expired — LeetCode returned no username. Please reconnect your cookie.',
      })
    }

    const solved = []
    const attempted = []
    for (const p of (data.stat_status_pairs || [])) {
      const slug = p.stat?.question__title_slug
      if (!slug) continue
      if (p.status === 'ac') solved.push(slug)
      else if (p.status === 'notac') attempted.push(slug)
    }

    console.log(`[sync] ${data.user_name}: ${solved.length} solved, ${attempted.length} attempted`)
    res.json({ username: data.user_name, solved, attempted })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/graphql', async (req, res) => {
  const { query, variables, session } = req.body;
  if (!session) return res.status(401).json({ error: 'No session provided' });

  const cookieStr = cachedCsrf
    ? `LEETCODE_SESSION=${session}; csrftoken=${cachedCsrf}`
    : `LEETCODE_SESSION=${session}`;

  try {
    const response = await fetch(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieStr,
        Referer: 'https://leetcode.com/',
        Origin: 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(cachedCsrf ? { 'x-csrftoken': cachedCsrf } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch topic tags for a batch of problem slugs (used by custom roadmap builder)
const TAGS_QUERY = `query getQ($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    title difficulty topicTags { name slug }
  }
}`

app.post('/api/tags', async (req, res) => {
  const { slugs = [], session } = req.body;
  const cookieStr = cachedCsrf
    ? `LEETCODE_SESSION=${session || ''}; csrftoken=${cachedCsrf}`
    : `LEETCODE_SESSION=${session || ''}`;
  const headers = {
    'Content-Type': 'application/json',
    Cookie: cookieStr,
    Referer: 'https://leetcode.com/',
    Origin: 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ...(cachedCsrf ? { 'x-csrftoken': cachedCsrf } : {}),
  };

  const results = [];
  for (const slug of slugs.slice(0, 150)) {
    try {
      const r = await fetch(LEETCODE_GRAPHQL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: TAGS_QUERY, variables: { titleSlug: slug } }),
      });
      const d = await r.json();
      const q = d?.data?.question;
      if (q) results.push({ slug, titleSlug: slug, ...q });
      else results.push({ slug, error: 'Not found' });
    } catch (e) {
      results.push({ slug, error: e.message });
    }
    await new Promise(r => setTimeout(r, 60)); // avoid hammering LeetCode
  }
  res.json(results);
});

const FAVORITE_QUERY = `query favoriteQuestionList($favoriteSlug: String!, $limit: Int, $skip: Int) {
  favoriteQuestionList(favoriteSlug: $favoriteSlug limit: $limit skip: $skip) {
    hasMore totalLength
    questions { titleSlug title difficulty topicTags { name slug } }
  }
}`

// Fetch a LeetCode list/collection — supports both selectedList and favoriteSlug types
app.post('/api/list', async (req, res) => {
  const { id, type, session } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });

  const cookieStr = session
    ? (cachedCsrf ? `LEETCODE_SESSION=${session}; csrftoken=${cachedCsrf}` : `LEETCODE_SESSION=${session}`)
    : '';
  const gqlHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Referer: 'https://leetcode.com/',
    Origin: 'https://leetcode.com',
    ...(cookieStr ? { Cookie: cookieStr } : {}),
    ...(cachedCsrf ? { 'x-csrftoken': cachedCsrf } : {}),
  };

  try {
    if (type === 'favorite') {
      // Company lists, study plans, curated lists — use GraphQL favoriteQuestionList
      const allQuestions = [];
      const pageSize = 100;
      let skip = 0;
      let hasMore = true;
      while (hasMore && allQuestions.length < 500) {
        const r = await fetch(LEETCODE_GRAPHQL, {
          method: 'POST',
          headers: gqlHeaders,
          body: JSON.stringify({ query: FAVORITE_QUERY, variables: { favoriteSlug: id, limit: pageSize, skip } }),
        });
        if (!r.ok) return res.status(r.status).json({ error: `LeetCode returned ${r.status}` });
        const d = await r.json();
        const list = d?.data?.favoriteQuestionList;
        if (!list) {
          const errMsg = d?.errors?.[0]?.message || 'favoriteQuestionList returned null — list may be private or slug is invalid';
          return res.status(400).json({ error: errMsg });
        }
        allQuestions.push(...(list.questions || []));
        hasMore = list.hasMore;
        skip += pageSize;
      }
      const problems = allQuestions.map(q => ({
        titleSlug: q.titleSlug,
        title: q.title,
        difficulty: q.difficulty || 'Medium',
        topicTags: q.topicTags || [],
      })).filter(p => p.titleSlug);
      return res.json({ problems });
    }

    // type === 'list' — selectedList hash, use unofficial REST endpoint
    const url = `https://leetcode.com/list/api/get_question_detail/${id}/`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(cookieStr ? { Cookie: cookieStr } : {}),
        Referer: 'https://leetcode.com/',
      },
    });

    if (!r.ok) return res.status(r.status).json({ error: `LeetCode returned ${r.status}` });
    const data = await r.json();

    const raw = data.questions || data.question_list || [];
    const problems = raw.map(q => ({
      titleSlug: q.stat?.question__title_slug || q.titleSlug || '',
      title: q.stat?.question__title || q.title || '',
      difficulty: ['', 'Easy', 'Medium', 'Hard'][q.difficulty?.level || 0] || q.difficulty || 'Medium',
      topicTags: q.topicTags || [],
    })).filter(p => p.titleSlug);

    // If topicTags are missing, fetch them individually
    if (problems.length > 0 && problems[0].topicTags.length === 0) {
      const tagged = [];
      for (const slug of problems.map(p => p.titleSlug).slice(0, 150)) {
        try {
          const tr = await fetch(LEETCODE_GRAPHQL, {
            method: 'POST', headers: gqlHeaders,
            body: JSON.stringify({ query: TAGS_QUERY, variables: { titleSlug: slug } }),
          });
          const td = await tr.json();
          const q = td?.data?.question;
          if (q) tagged.push({ titleSlug: slug, ...q });
        } catch { tagged.push({ titleSlug: slug, title: slug, difficulty: 'Medium', topicTags: [] }); }
        await new Promise(r => setTimeout(r, 60));
      }
      return res.json({ problems: tagged });
    }

    res.json({ problems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`LeetCode Roadmap → ${url}`);
  const cmd = process.platform === 'win32'
    ? `start ${url}`
    : process.platform === 'darwin'
    ? `open ${url}`
    : `xdg-open ${url}`;
  exec(cmd);
});
