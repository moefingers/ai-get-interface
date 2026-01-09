# AI Platform Quirks & Known Issues

## Gemini

### Tool Calling on Initial Prompts (1/8/2026)

**Issue:** Gemini does not reliably execute tools/actions on the initial prompt in a conversation.

**Workaround:** Use a 2-step confirmation flow in saved instructions:
1. First response: Gemini confirms the request (enables tool calling)
2. User confirms → Gemini executes the tool

**Example instruction pattern:**
```
When I mention "X", first respond ONLY with "X, [values]?" for confirmation.
When I confirm, [execute action].
```

This forces a conversational turn before tool execution, which reliably enables Gemini's tool-calling capabilities.

---

## ChatGPT

### Unverified Link Warning

**Issue:** ChatGPT shows "This link isn't verified" warning for external URLs.

**Workaround:** 
- Create a Custom GPT with Actions (bypasses warning)
- Or instruct users to click through the warning

### OpenAI Plugin Manifest

We've added `/.well-known/ai-plugin.json` and `/.well-known/openapi.yaml` to help with verification, but this doesn't fully eliminate the warning for regular conversations.

---

## Google Assistant

### No Direct HTTP Calls

**Issue:** Google Assistant/Home cannot directly call arbitrary HTTP endpoints.

**Workarounds:**
- Home Assistant integration (fake media player trick)
- IFTTT webhooks
- Custom Smart Home Action (requires Google Cloud setup)

See [Home_Assistant_Setup.md](./Home_Assistant_Setup.md) for details.
