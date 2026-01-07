# Potential Security Solution

## Disclaimer

**This application uses a deliberately weak authentication algorithm to enable compatibility with ChatGPT and other AI assistants that refuse to perform cryptographic operations.**

The security model prioritizes functionality over cryptographic strength. This is acceptable because:

1. The data being protected (grocery lists, to-do items) is low-value
2. Attacks require sustained man-in-the-middle traffic monitoring
3. The effort-to-reward ratio for attackers is extremely unfavorable
4. Additional mitigations (one-time windows, rate limiting) reduce practical risk

**Do NOT use this authentication approach for sensitive data.**

---

## The Problem

| AI Model | SHA-256 | HMAC-SHA256 | Large Multiplication |
|----------|---------|-------------|----------------------|
| Gemini | Refuses | Refuses | Errors on large numbers |
| ChatGPT | Refuses | Refuses | Errors on large numbers |

Both major AI assistants categorize hash functions as "cryptographic operations" and refuse to compute them, even though they're just math.

---

## Current Implementation

We retain HMAC-SHA256 server-side. This means:
- **Gemini**: May work if it computes the hash (inconsistent)
- **ChatGPT**: Will not work (consistently refuses)

---

## Potential ChatGPT-Compatible Algorithm

If ChatGPT support becomes critical, this algorithm was designed to be:
- Computable by ChatGPT (small numbers, simple operations)
- Reasonably resistant to casual attacks
- Acknowledged as cryptographically weak

### The Algorithm

```
Key: 64-character hex token (stored in AI memory)
W = floor(unix_seconds / 30) mod 10000

Step 1: Extract indices from W
  - Write W as 4+ digits
  - i1 = (digits 0-1) mod 64
  - i2 = (digits 2-3) mod 64
  - i3 = (ASCII of key[0] + digit 4) mod 64
  - i4 = (ASCII of key[1] + digit 5) mod 64

Step 2: Sample key at those positions
  - Get ASCII code of key[i1], key[i2], key[i3], key[i4]

Step 3: Combine with non-linear operation
  - sum = key[i1] + key[i2] + key[i3] + key[i4]
  - t = sum mod 9973

Final: t is a 4-digit code
```

### Why This Design

| Feature | Purpose |
|---------|---------|
| Index-based sampling | Different windows touch different key positions |
| Key-derived indices (i3, i4) | Per-list uniqueness without algorithm changes |
| Non-linear mod | Breaks linear algebra attacks |
| Small numbers throughout | ChatGPT can compute without errors |

### Known Weaknesses

1. **Algorithm is public** - visible in user's AI instructions
2. **Key space is reducible** - ASCII sum of 64 hex chars: ~3,500 values
3. **Linear system solvable** - ~20+ observations may reveal key
4. **No bit mixing** - small input changes → predictable output changes

### Mitigations

| Defense | Effect |
|---------|--------|
| One-time window enforcement | Each (list, window) pair works once |
| 30-second expiry | Small attack window |
| Rate limiting | Slow brute force attempts |
| Low-value target | No attacker motivation |

---

## Recommendation

**For v1:** Keep HMAC-SHA256, accept that ChatGPT won't work, recommend Gemini.

**If ChatGPT demand is high:** Implement the weak algorithm with:
- Clear user warning about reduced security
- One-time window enforcement (server tracks used windows)
- Optional "high security mode" that disables ChatGPT

---

## Future Possibilities

1. **ChatGPT improves** - May eventually compute SHA-256
2. **Tool-use mode** - ChatGPT could call a hash API we provide
3. **Hybrid approach** - ChatGPT read-only, Gemini read-write
4. **Accept the tradeoff** - Weak auth is fine for grocery lists

---

*Last updated: January 6, 2026*
