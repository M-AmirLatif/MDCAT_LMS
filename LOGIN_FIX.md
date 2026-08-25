# Permanent fix for intermittent login failures

Symptom: signing in worked sometimes and failed other times, with the toast
**"The server is temporarily unavailable. Please try again in a moment."** —
affecting both *Continue with Google* and email + password.

That exact message is produced in `frontend/src/services/api.js` only when there
is **no HTTP response at all**. So this was never a wrong-password or
validation bug; the connection itself was dying. Six independent causes were
found, five in code (now fixed) and one in infrastructure (needs your action in
step 1 below).

---

## Part 1 — What was wrong, and what changed

### 1. The backend killed itself whenever MongoDB hiccuped

`backend/src/config/db.js` ended with `process.exit(1)` inside the catch block.
That block wrapped `mongoose.connect` (with an aggressive 5-second server
selection timeout), the auth-defaults bootstrap, **and** a legacy role migration
that scanned the entire `users` collection with no index — plus `autoIndex: true`
rebuilding indexes on every boot.

On Hostinger shared hosting, Passenger idles your app out and re-spawns it on the
next request. So that whole sequence re-ran constantly, and any brief Atlas
wobble killed the process *mid-request*. The browser saw a dropped connection and
reported "Network Error". This is the single biggest reason both sign-in methods
failed together.

Now: connection retries forever with exponential backoff (1s → 30s cap) and never
exits. Bootstrap failures are logged but don't take the API down. The migration
and index builds are off in production behind env flags. Server-selection timeout
raised to 20s.

### 2. No crash guards

An unhandled promise rejection or uncaught exception terminates Node outright.
There were no handlers at all. Worse, the gzip middleware in `server.js` set
response headers inside an *async* zlib callback — if the client had already
disconnected, that threw `ERR_HTTP_HEADERS_SENT` and took the entire process down
with it, killing every other in-flight request too.

Now: `unhandledRejection` logs only. `uncaughtException` distinguishes recoverable
faults (`ECONNRESET`, `EPIPE`, `ERR_HTTP_HEADERS_SENT`, …) from fatal ones, and
only drains-and-restarts on the latter. The gzip path checks
`headersSent / writableEnded / destroyed` and is fully wrapped in try/catch.

### 3. Google sign-in shared ONE rate-limit bucket across all users

This is why *Continue with Google* failed intermittently and seemingly at random.

`rateLimiter.js` keyed its bucket on the request's email address, falling back to
IP. But `POST /api/auth/google` sends only `{ credential }` — there is no email in
the body. So every Google sign-in fell back to the IP key, and behind Hostinger's
proxy that is *one IP for everybody*. The result: **20 Google logins per 15
minutes for your entire site**, after which everyone got blocked until the window
rolled over.

Now: the limiter decodes the `sub` claim from the Google ID token (unverified, for
bucketing only — the signature is still fully verified in `googleLogin`) and keys
per Google account. The limit is 60/15min per account.

Two more bugs in the same file: the `Map` never evicted expired entries, so it
grew for the process lifetime until an OOM kill; and 429 responses carried no
`Retry-After`. Both fixed, with a hard 20,000-key ceiling and a 5-minute sweeper.

Because keying purely by identity would have removed the credential-stuffing
ceiling, `routes/auth.js` now also applies a deliberately generous IP-scoped layer
(150/15min, 1500 on a detected shared proxy IP) in front of `/register` and
`/login`.

### 4. The frontend's retry logic was dead code

`api.js` only retried when `originalRequest.baseURL !== FALLBACK_API_BASE_URL`.
Your Vercel `VITE_API_BASE_URL` is `https://api.acemdcat.com/api`, which is
byte-identical to the hardcoded fallback — so that condition was **always false
and nothing was ever retried**. Login was hit hardest because it's a POST, and
POSTs were excluded regardless. One momentary blip always reached the user.

Now: network errors, timeouts and 502/503/504 retry twice with exponential
backoff + jitter, honouring `Retry-After`. Safe methods always retry; for POSTs
only `/auth/login` and `/auth/google` are replayed, so no domain mutation can
ever double-fire.

### 5. A transient error during login logged you straight back out

`AuthContext.jsx`'s `verifyAuth()` had a bare `catch { logout() }`. Any failure of
`GET /auth/profile` — including a network blip or a cold-start 503 — destroyed the
session that had *just* been created and bounced you to `/login`. So even a
successful sign-in could be undone a moment later.

Now: it only signs out on a real 401/403. Anything else keeps the cached session
and logs a warning; the next authenticated request re-validates.

### 6. Cold-start requests now get a readable answer

`app.listen()` binds before Mongo finishes connecting. Requests arriving in that
window used to queue on Mongoose's command buffer and fail opaquely. There is now
a readiness gate returning a proper CORS-enabled `503` with `Retry-After: 3` and
`code: DB_UNAVAILABLE`, which the new frontend retry logic handles automatically.
A rejected CORS origin also returns an explicit `403 CORS_REJECTED` instead of a
header-less 500 that the browser could only report as "Network Error".

---

## Part 2 — Actions you need to take

### Step 1 (most important): shut down the old Railway backend

You said you moved the backend to Hostinger but never deleted it from Railway,
and it is still pointed at the same MongoDB Atlas database. **No code change can
fix this** — it is an independent cause of the exact symptom you're seeing.

Your app enforces single-device login by writing `activeSessionId` onto the user
document. When you sign in on Hostinger, it writes a new session ID. If anything
still reaches the Railway instance, it writes a *different* one — and whichever
wrote last invalidates the other, producing `SESSION_SUPERSEDED` 401s that log you
out for no visible reason. If the two deployments have different `JWT_SECRET`
values, tokens minted by one are rejected outright by the other. And both were
running the 30-second notification scheduler against the same collection,
double-claiming and double-sending jobs.

Best: delete the Railway service. If you want to keep it as a fallback, then at
minimum remove its public domain so nothing can route to it, and set
`ENABLE_SCHEDULER=false` there.

### Step 2: set the new backend env vars in hPanel

In hPanel → Node.js app → environment variables:

```
DEPLOYMENT_TARGET=hostinger
TRUST_PROXY=1
ENABLE_SCHEDULER=true
MONGO_SERVER_SELECTION_TIMEOUT_MS=20000
MONGO_POOL_SIZE=10
MONGO_AUTO_INDEX=false
RUN_LEGACY_ROLE_MIGRATION=false
```

`TRUST_PROXY=1` matters: if Express doesn't trust the proxy, `req.ip` is the
proxy's address for every visitor and rate limiting collapses into one bucket
again. Confirm it's right by checking that two different people hitting login
don't affect each other's limits.

Also verify `JWT_SECRET` and `GOOGLE_CLIENT_ID` here match what the frontend
expects, and that `CORS_ORIGINS` includes `https://acemdcat.com` and
`https://www.acemdcat.com`.

### Step 3: run the index sync once

Production `autoIndex` is now off, so indexes are no longer created on boot. Run
this once after deploying (and again after any schema change):

```bash
cd backend && npm run sync-indexes
```

### Step 4: check MongoDB Atlas network access

Atlas → Network Access must allow Hostinger's outbound IP. Shared hosting egress
IPs are not stable, so `0.0.0.0/0` is the practical setting (the connection is
still protected by SRV credentials). An IP-blocked connection looks exactly like a
transient outage from the outside.

### Step 5: keep the app warm

Passenger idles an unused Node app and re-spawns it on the next request, and a
cold start is slow — measurably so, since the app pulls in heavy dependencies at
require time. That cold start *is* the window in which login used to break.

Point an uptime monitor (UptimeRobot, cron-job.org, Better Stack — any free tier
works) at `https://api.acemdcat.com/api/health` every 5 minutes. This endpoint is
deliberately exempt from the DB readiness gate, so it answers even while Mongo is
still connecting, and it never touches the database.

### Step 6: verify

```bash
curl https://api.acemdcat.com/api/health/db
```

Expect `status: OK`, `dbState: connected`, and `deploymentTarget: hostinger`.

Then run it against your Railway URL too. If it answers, that service is still
live — go back to step 1. The `instanceId` field tells you whether two requests
hit the same process, which is how you confirm which backend a domain really
resolves to.

### Step 7: update the docs

`DEPLOYMENT.md` still documents Railway as the backend host. That's now stale and
will mislead whoever deploys next.

---

## What was verified

Runtime tests against the real server with MongoDB deliberately unreachable:

| Check | Result |
|---|---|
| Process survives an unreachable MongoDB | Passes (old code called `process.exit(1)` here) |
| Connection retries with backoff | Passes — 1s, 2s, 4s, 8s, 16s observed |
| `/api/health` answers while DB is down | 200 |
| `/api/health/db` reports degraded state | 503 `DEGRADED`, `dbState: connecting` |
| `POST /auth/login` during startup | 503 `DB_UNAVAILABLE` + `Retry-After: 3` |
| CORS headers present on that 503 | `Access-Control-Allow-Origin` present (absence is what caused "Network Error") |
| Disallowed origin | explicit 403 `CORS_REJECTED`, not an opaque 500 |
| Gate opens once DB connects | Passes — requests flow through |
| Graceful shutdown on SIGTERM | Passes |

Rate limiter unit tests confirm Google accounts get isolated buckets, per-identity
keying works, the shared-proxy ceiling holds, 429s carry `Retry-After`, and
malformed credentials are handled safely. All changed backend files pass
`node --check`; both changed frontend files pass ESLint apart from one
pre-existing `react-refresh` warning on `useAuth` that exists at `HEAD`.

Not verified locally: a full happy-path login (no MongoDB available in the test
environment) and `vite build` (the Linux `rolldown` native binary isn't installed
in `node_modules`, which was installed on Windows — Vercel installs its own).

## Files changed

```
backend/src/config/db.js              retry-forever connect, no process.exit
backend/src/server.js                 crash guards, readiness gate, /api/health/db,
                                      TRUST_PROXY, scheduler gate, graceful shutdown
backend/src/middlewares/rateLimiter.js  per-identity keying, eviction, Retry-After
backend/src/routes/auth.js            separate Google + IP limiters
backend/scripts/syncIndexes.js        new — one-off index sync
backend/package.json                  added "sync-indexes" script
backend/.env.example                  documented the new vars
frontend/src/services/api.js          working retry/backoff, better error messages
frontend/src/context/AuthContext.jsx  only sign out on 401/403
```
