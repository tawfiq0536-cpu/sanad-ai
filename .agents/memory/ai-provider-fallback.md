---
name: Chatbot AI provider fallback
description: How the government-portal chatbot routes AI requests and falls back to direct Excel answers when providers fail.
---

# Chatbot AI provider fallback

The chatbot in `artifacts/api-server/src/routes/chat.ts` uses a chain of AI providers, falling back to direct answers from the Excel knowledge base if all providers fail.

## Provider chain

1. **NVIDIA NIM** — used first when `NVIDIA_API_KEY` is set. This is the working provider for this project.
2. **Google Gemini** — used if NVIDIA fails or is unavailable. Requires `GEMINI_API_KEY`.
3. **Direct Excel fallback** — returns the best-matching knowledge entries with a warning that NVIDIA is unavailable.

## NVIDIA NIM details

- Key prefix: `nvapi-`.
- Endpoint: `https://integrate.api.nvidia.com/v1/chat/completions` (OpenAI-compatible).
- Default model that works with this account: `meta/llama-3.1-8b-instruct`.
- Other models may return `404` or `502`; the code retries `5xx` errors up to 2 times with a short delay.
- NVIDIA NIM can return intermittent `502 Bad Gateway` errors, so the retry is important for reliability.

## Why the fallback order matters

NVIDIA is the current primary provider because the Gemini free tier quota is exhausted for this project. Gemini remains as a secondary fallback so it can take over automatically if a working Google key is provided later. If both AI providers fail, the bot returns the best Excel match directly.

## Source extraction

The model may return the reference line in Markdown (`**📎 المرجع:** ...`). The `extractSource()` helper strips Markdown and the label before returning the source.

## Chat mode

`CHAT_MODE` (env var) controls the response source:
- `ai` (default): uses NVIDIA first, then Gemini, then falls back to direct Excel answers.
- `direct`: returns the best-matching Excel rows directly without AI rewriting.

## Production publishing

The live deployment only picks up new API routes and provider changes after the user clicks **Publish** in the Publishing pane. The `/api/suggested-questions` endpoint, the NVIDIA fallback, and the `CHAT_MODE` direct mode are not live until a republish happens.
