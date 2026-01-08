# Security Problem Constraints

## Problem Statement

AI assistants (ChatGPT, Gemini, Google Assistant) must compute time-based authentication codes to append items to user lists via GET requests. The algorithm must be:
- Secure enough to prevent unauthorized access
- Simple enough for LLMs to compute without triggering refusals or spawning code interpreters

---

## Core Constraints

| # | Constraint | Why | Implementation Notes |
|---|------------|-----|---------------------|
| 1 | **One-way** | Observing (input, output) pairs shouldn't reveal the secret key | True one-wayness requires bit-mixing that ChatGPT can't perform; we accept "computationally expensive to reverse" |
| 2 | **ChatGPT computable** | Must use basic arithmetic operations ChatGPT will execute | Adds, multiplies, mods, index lookups—nothing that looks cryptographic |
| 3 | **No crypto keywords** | Triggers refusals in ChatGPT/Gemini | Avoid: "hash", "HMAC", "SHA", "encrypt", "digest", "cipher", "MAC" |
| 4 | **No data analysis mode** | Python sandbox = slow, inconsistent, sometimes unavailable | Triggered by large numbers, arrays, or "compute this for me" phrasing |
| 5 | **Collision resistant** | Output space large enough that random guesses are impractical | 6-8 digits minimum (1M–100M possibilities) |
| 6 | **Deterministic** | Server can validate the code | Same key + same time window → same output code |
| 7 | **Time-bound** | Prevents replay attacks | Output depends on current 30-second window |

---

## Additional Constraints

| # | Constraint | Why |
|---|------------|-----|
| 8 | **Step-count bounded** | ChatGPT follows ~5-10 explicit steps reliably; more causes drift/errors |
| 9 | **No floating point** | Division must be integer (floor/mod); floats cause cross-platform inconsistency |
| 10 | **Instruction-embeddable** | Algorithm must fit in ~200 words in Custom Instructions without overwhelming other content |
| 11 | **Human-auditable output** | User should be able to manually verify the code if suspicious |
| 12 | **Per-list isolation** | Compromising one list's key shouldn't help attack others |

---

## Derived Design Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Output space** | 6-8 digits (1M–100M) | Resists brute force within 30-second window when rate-limited |
| **Key size** | 64 characters hex (256-bit equivalent) | Large enough that even with algorithm known, key space isn't trivially searchable |
| **Window size** | 30 seconds | Balance between usability (AI has time to respond) and security (limits replay window) |
| **Max steps** | 5-10 arithmetic operations | ChatGPT reliability threshold |
| **Number magnitude** | ≤10,000 per intermediate value | Larger numbers trigger data analysis mode |

---

## Open Questions & Answers

### How many observations should be "safe"?

**Target: ≤50 windows (≤25 minutes of active MITM)**

Rationale: If an attacker is actively intercepting traffic, 50 windows means ~25 minutes of sustained man-in-the-middle position. This is a reasonable security boundary given:
- Attacker must already have network access
- Each observation requires the user to actively use the system
- Rate limiting prevents rapid collection

### Is rate limiting assumed?

**Yes, required.**

At 1 request/second:
- 6-digit code (1M possibilities) → ~11 days to brute force per window
- 8-digit code (100M possibilities) → ~3 years to brute force per window

Without rate limiting, any code space is brute-forceable in <30 seconds with sufficient parallelism.

### Are one-time windows assumed?

**Yes, strongly recommended.**

Each code should work exactly once per list per window. Benefits:
- Replay within same window fails
- Limits attacker to 1 observation per 30 seconds (2 per minute)
- 50 observations requires ~25 minutes of active MITM

---

## Threat Model Scope

| Threat | Defended? | Notes |
|--------|-----------|-------|
| **Passive eavesdropping** | Partially | Attacker sees codes but can't replay (one-time) or predict next (algorithm unknown) |
| **Active MITM** | Partially | Can collect observations; with enough, may solve for key |
| **Compromised AI memory** | No | If attacker reads user's Custom Instructions, they have the key |
| **Brute force** | Yes | Rate limiting + code space makes infeasible |
| **Replay attacks** | Yes | One-time window enforcement + time-bound codes |

---

## Implementation Options

### Option A: Strong (HMAC-SHA256)

- **Pro:** Cryptographically secure, proven
- **Con:** ChatGPT refuses to compute; only works with Gemini (maybe)
- **Use when:** Security is paramount, user accepts Gemini-only

### Option B: Weak (Arithmetic-based)

- **Pro:** ChatGPT can compute it
- **Con:** ~50 observations could theoretically solve for key
- **Use when:** Convenience matters, threat model accepts limited exposure

### Option C: Hybrid

- Offer both algorithms, let user choose security level per list
- Display warnings about tradeoffs in UI

### Option D: Tool-calling escape hatch

- ChatGPT Custom GPTs can call external APIs
- A `/compute-code` endpoint would sidestep all math constraints
- **Pro:** Full security with ChatGPT
- **Con:** Requires GPT-4 Custom GPT setup, adds latency

---

## Required Server-Side Mitigations

Regardless of algorithm choice, these are **required**:

1. **Rate limiting** — 1 request per second per IP/list
2. **One-time window enforcement** — Each code works once per list per window
3. **Logging** — Track failed attempts for anomaly detection
4. **Per-list tokens** — Compromise of one list doesn't affect others

---

*Last updated: January 7, 2026*
