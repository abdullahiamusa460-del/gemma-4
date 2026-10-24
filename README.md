# 🌟 Gemma 4 AI Assistant

A simple, fast AI web app powered by Google's **Gemma 4** model. It helps you turn long notes, study guides, and articles into clean summaries, key bullet points, and quick review questions.

It supports two modes with the exact same code path:
1. **Google AI Studio (Cloud API):** Uses Google's hosted Gemma 4 model (`gemma-4-31b-it`).
2. **Local Ollama (Offline Fallback):** Runs completely on your own machine using Ollama (`gemma4:e2b`).

---

## 🚀 Quick Start (Setup)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (.env)
Copy the example file to create your own `.env`:
```bash
cp .env.example .env
```

Open `.env` and fill in your settings:
```env
# Your Google AI Studio API Key (never shared with the browser)
GEMINI_API_KEY="your_api_key_here"

# Choose your provider: 'api' or 'local'
PROVIDER="api"

# Gemma 4 Cloud Model ID
GEMMA_API_MODEL="gemma-4-31b-it"

# Local Ollama Settings
OLLAMA_MODEL="gemma4:e2b"
OLLAMA_HOST="http://localhost:11434"
```

---

## 🌐 Running the App

### Mode A: Run with Google AI Studio (Default)
1. Make sure `PROVIDER=api` is set in `.env` and your `GEMINI_API_KEY` is provided.
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:3000`.

---

### Mode B: Run Locally with Ollama (Offline)
1. Install [Ollama](https://ollama.ai) on your computer.
2. Download the Gemma 4 local model:
   ```bash
   ollama pull gemma4:e2b
   ```
3. Make sure Ollama is running:
   ```bash
   ollama serve
   ```
4. Set `PROVIDER=local` in your `.env` (or toggle "Local Ollama" in the top bar of the web app).
5. Start the web app:
   ```bash
   npm run dev
   ```

---

## 🧪 Running the Smoke Test

We built an automated smoke test script with realistic study notes (Photosynthesis). It verifies that your chosen provider communicates with Gemma 4 properly and prints **PASS** or **FAIL**.

Run the test with the active provider from `.env`:
```bash
npm run test:smoke
```

Or test a specific provider directly:
```bash
# Test Google AI Studio API
npx tsx smoke-test.ts --provider=api

# Test Local Ollama
npx tsx smoke-test.ts --provider=local
```

If everything works, you will see:
```text
Result: PASS
```

---

## 🔒 Security & Privacy
- **Server-Side API Key:** Your `GEMINI_API_KEY` is never included in the browser bundle or exposed in JavaScript. All requests go through the lightweight Express backend (`server.ts`).
- **Protected Environment:** `.gitignore` excludes `.env` so keys cannot be accidentally committed to git.
