import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

export interface GemmaRunOptions {
  prompt: string;
  systemInstruction?: string;
  provider?: 'api' | 'local';
  modelOverride?: string;
}

export interface GemmaRunResult {
  text: string;
  provider: 'api' | 'local';
  model: string;
}

/**
 * Unified execution path for Gemma 4.
 * Both the cloud Gemini API and local Ollama execute the same prompt structure.
 */
export async function runGemma(options: GemmaRunOptions): Promise<GemmaRunResult> {
  const envProvider = (process.env.PROVIDER || 'api').trim().toLowerCase();
  const activeProvider: 'api' | 'local' =
    options.provider === 'local' || (options.provider !== 'api' && envProvider === 'local')
      ? 'local'
      : 'api';

  if (activeProvider === 'local') {
    const host = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/+$/, '');
    const model = options.modelOverride || process.env.OLLAMA_MODEL || 'gemma4:e2b';

    const fullPrompt = options.systemInstruction
      ? `${options.systemInstruction.trim()}\n\n---\n\n${options.prompt.trim()}`
      : options.prompt.trim();

    try {
      const response = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: fullPrompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama returned status ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as { response?: string };
      const outputText = data.response?.trim() || '';
      return {
        text: outputText,
        provider: 'local',
        model,
      };
    } catch (err: any) {
      if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error(
          `Cannot reach local Ollama at ${host}. Please verify Ollama is running ('ollama serve') and model '${model}' is downloaded ('ollama pull ${model}').`
        );
      }
      throw err;
    }
  } else {
    // Cloud API via Google Gen AI SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set on the server. Please add your API key in AI Studio Secrets or your .env file.'
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const model = options.modelOverride || process.env.GEMMA_API_MODEL || 'gemma-4-31b-it';

    const response = await ai.models.generateContent({
      model,
      contents: options.prompt,
      config: options.systemInstruction
        ? {
            systemInstruction: options.systemInstruction,
          }
        : undefined,
    });

    const outputText = response.text?.trim() || '';
    return {
      text: outputText,
      provider: 'api',
      model,
    };
  }
}

// System instructions for structured note assistance
const SYSTEM_PROMPT = `You are a friendly, expert study assistant powered by Gemma 4.
Your goal is to help learners understand, summarize, and retain complex notes in clear, simple language without jargon.
When summarizing notes:
1. Provide a concise Overview (2-3 sentences).
2. List 3-5 Key Bullet Points with bold highlights.
3. Provide 2-3 Quick Practice Questions to test understanding.
Format your response with clean Markdown.`;

// API routes
app.get('/api/status', async (_req: Request, res: Response) => {
  const currentProvider = (process.env.PROVIDER || 'api').trim().toLowerCase();
  const apiModel = process.env.GEMMA_API_MODEL || 'gemma-4-31b-it';
  const localModel = process.env.OLLAMA_MODEL || 'gemma4:e2b';
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);

  let localReachable = false;
  try {
    const check = await fetch(`${ollamaHost.replace(/\/+$/, '')}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(1200),
    });
    localReachable = check.ok;
  } catch {
    localReachable = false;
  }

  res.json({
    activeProvider: currentProvider === 'local' ? 'local' : 'api',
    apiModel,
    localModel,
    ollamaHost,
    hasApiKey,
    localReachable,
  });
});

app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const { text, mode, provider, modelOverride } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Please provide text or notes to summarize.' });
      return;
    }

    let instruction = SYSTEM_PROMPT;
    let prompt = `Here are the notes to analyze:\n\n${text.trim()}`;

    if (mode === 'quick_summary') {
      instruction = 'You are a concise study summarizer. Provide a crisp 3-4 sentence summary of the material in plain English.';
      prompt = `Summarize this text briefly:\n\n${text.trim()}`;
    } else if (mode === 'key_takeaways') {
      instruction = 'You are an analytical tutor. Extract the top 5 essential takeaways from the text as actionable, bold bullet points.';
      prompt = `Extract the key bullet points from this text:\n\n${text.trim()}`;
    } else if (mode === 'study_quiz') {
      instruction = 'You are a supportive teacher. Create 3 review questions with brief answers based on the material provided.';
      prompt = `Generate 3 review questions and answers based on this text:\n\n${text.trim()}`;
    }

    const result = await runGemma({
      prompt,
      systemInstruction: instruction,
      provider: provider === 'local' || provider === 'api' ? provider : undefined,
      modelOverride,
    });

    res.json({
      success: true,
      text: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: any) {
    console.error('Error during summarize request:', error);
    res.status(500).json({
      error: error.message || 'An unexpected error occurred while processing with Gemma 4.',
    });
  }
});

// Generic generate endpoint (also used by smoke test and external tools)
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, provider, modelOverride } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Missing prompt in request body.' });
      return;
    }

    const result = await runGemma({
      prompt,
      systemInstruction,
      provider,
      modelOverride,
    });

    res.json({
      success: true,
      text: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to generate output with Gemma.',
    });
  }
});

// Vite server in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemma 4 application listening on http://0.0.0.0:${PORT}`);
  });
}

// Only listen if executed directly (e.g. `tsx server.ts` or `node server.ts`)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

