# Google Apps Script Relay Setup

## Architecture

```
User → Gemini → Apps Script URL → POST /api/relay → Database
                    ↓
         Session.getActiveUser().getEmail()
```

AI assistants can't compute cryptographic hashes, so we use Google Apps Script as a relay:
- Apps Script identifies the user via their Google account email
- Forwards requests to `/api/relay` with email + list + item
- API looks up user by email, verifies list ownership, creates item

## GCP Project: `ai-get-interface`

- **OAuth consent screen**: External, verified
- **Branding**: App name, logo, homepage, privacy policy, terms of service
- **Scopes**: `userinfo.email` (accessed via `Session.getActiveUser().getEmail()`)
- **Domain verification**: Via Google Search Console HTML file

## Apps Script: `list-relay`

- Linked to GCP project via project number
- Deployed as web app: "Execute as user accessing the app"
- Gets caller's Google email, POSTs to `/api/relay`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_APP_SCRIPT_API_KEY` | Shared secret between Apps Script and `/api/relay` |

## Verification Requirements Met

- Public landing page (no login required)
- Privacy policy at `/privacy`
- Terms of service at `/terms`
- App name matches across OAuth screen and homepage
- Domain ownership verified via Search Console
