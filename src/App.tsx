import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Cloud,
  HardDrive,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  FileText,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface ServerStatus {
  activeProvider: 'api' | 'local';
  apiModel: string;
  localModel: string;
  ollamaHost: string;
  hasApiKey: boolean;
  localReachable: boolean;
}

interface SamplePreset {
  title: string;
  category: string;
  content: string;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    title: '🌿 Biology: Photosynthesis',
    category: 'Science',
    content: `Photosynthesis is how plants, algae, and blue-green bacteria turn light energy into sugar. 
Inputs: Carbon dioxide (CO2) from air, water (H2O) from soil, and light from the sun.
Outputs: Glucose (sugar for food and growth) and oxygen (O2) which is breathed by animals and humans.
The formula: 6CO2 + 6H2O + Sunlight -> C6H12O6 + 6O2.
It happens inside plant cells in tiny compartments called chloroplasts containing green chlorophyll. Without photosynthesis, Earth would lack oxygen and living food chains would collapse.`,
  },
  {
    title: '🏛️ History: Industrial Revolution',
    category: 'History',
    content: `The Industrial Revolution started in Great Britain in the late 1700s and transformed human society from farm-based handicraft to factory-based machine manufacturing.
Key inventions: James Watt's improved steam engine, the Spinning Jenny, and steam-powered locomotives.
Effects: Cities grew rapidly (urbanization), goods became much cheaper and faster to make, but early workers faced long 14-hour days in dangerous factories before labor laws were created.`,
  },
  {
    title: '💻 Tech: What is an API?',
    category: 'Computing',
    content: `An API (Application Programming Interface) is a messenger that lets two different computer programs talk to each other.
Think of a restaurant waiter: you are the customer, the kitchen is the system, and the waiter is the API taking your order to the kitchen and bringing back your meal.
For example, when you check weather on your phone app, the app uses an API to ask the weather station's computer for current temperatures and displays it on your screen.`,
  },
  {
    title: '💼 Work: Weekly Project Update',
    category: 'Business',
    content: `Weekly sync notes for Project Falcon:
- Milestone 1 is 100% complete: Database setup and authentication passed security audit.
- Milestone 2 is in progress: Frontend dashboard design is 80% done; mobile responsive testing starts Wednesday.
- Blockers: Waiting on client feedback for branding logos by Friday 5 PM.
- Action items: Sarah to finish payment testing; David to record the user demo video; team meeting on Monday at 10 AM.`,
  },
];

type SummaryMode = 'full_breakdown' | 'quick_summary' | 'key_takeaways' | 'study_quiz';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState<SummaryMode>('full_breakdown');
  const [providerOverride, setProviderOverride] = useState<'api' | 'local' | 'default'>('default');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [modelUsed, setModelUsed] = useState('');
  const [providerUsed, setProviderUsed] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<ServerStatus | null>(null);

  // Fetch status on load
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data: ServerStatus) => setStatus(data))
      .catch((err) => console.error('Status fetch error:', err));
  }, []);

  const effectiveProvider =
    providerOverride === 'default' ? status?.activeProvider || 'api' : providerOverride;

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Please paste or type some notes first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResultText('');
    setCopied(false);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          mode: selectedMode,
          provider: providerOverride === 'default' ? undefined : providerOverride,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred.');
      }

      setResultText(data.text);
      setModelUsed(data.model);
      setProviderUsed(data.provider);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to Gemma 4.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setResultText('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Gemma 4 AI Assistant
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  Google Gemma 4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Simple note summarizer & study helper with local fallback
              </p>
            </div>
          </div>

          {/* Provider Selector / Indicator */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs border border-slate-200">
            <button
              onClick={() => setProviderOverride('api')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                effectiveProvider === 'api'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Runs via Google AI Studio Gemini API"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span>Google API (Gemma 4)</span>
            </button>
            <button
              onClick={() => setProviderOverride('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                effectiveProvider === 'local'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Runs locally using Ollama on your machine"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Local Ollama</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {/* Quick Preset Buttons */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Try a Sample (1-Click)
              </span>
              <span className="text-xs text-slate-400">Click to fill notes</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  onClick={() => {
                    setInputText(preset.content);
                    setErrorMsg('');
                  }}
                  className="text-left p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs font-medium text-slate-700"
                >
                  <p className="truncate font-semibold">{preset.title}</p>
                  <p className="text-[10px] text-slate-400">{preset.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="notes-input" className="text-sm font-semibold text-slate-800">
                Your Text or Notes
              </label>
              {inputText.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <textarea
              id="notes-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste any article, lecture notes, study guide, or meeting transcript here..."
              rows={9}
              className="w-full flex-1 p-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm leading-relaxed text-slate-800 resize-none transition-all"
            />

            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
              <span>{inputText.trim() ? `${inputText.trim().split(/\s+/).length} words` : '0 words'}</span>
              <span>{inputText.length} characters</span>
            </div>

            {/* Mode selection buttons */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                What do you want to get?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'full_breakdown',
                    label: 'Full Guide',
                    desc: 'Summary + Bullets + Quiz',
                    icon: FileText,
                  },
                  {
                    id: 'quick_summary',
                    label: 'Short Summary',
                    desc: 'Fast 3 sentences',
                    icon: Sparkles,
                  },
                  {
                    id: 'key_takeaways',
                    label: 'Key Takeaways',
                    desc: 'Bold bullet points',
                    icon: Lightbulb,
                  },
                  {
                    id: 'study_quiz',
                    label: 'Practice Quiz',
                    desc: '3 Review questions',
                    icon: HelpCircle,
                  },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isActive = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id as SummaryMode)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        {mode.label}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Generation Error</p>
                  <p className="mt-0.5">{errorMsg}</p>
                  {effectiveProvider === 'local' && (
                    <p className="mt-1 text-[11px] text-rose-600">
                      Tip: If using local Ollama, ensure it is running with <code className="bg-rose-100 px-1 py-0.5 rounded">ollama serve</code> and you have pulled the model with <code className="bg-rose-100 px-1 py-0.5 rounded">ollama pull gemma4:e2b</code>. Or switch to the Google API option above!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <span>Active Model:</span>
                <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  {effectiveProvider === 'api'
                    ? status?.apiModel || 'gemma-4-31b-it'
                    : status?.localModel || 'gemma4:e2b'}
                </span>
              </div>

              <button
                onClick={handleSummarize}
                disabled={loading || !inputText.trim()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${
                  loading || !inputText.trim()
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-98 cursor-pointer'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing with Gemma 4...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Summarize Notes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Results & Info (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">Output Result</span>
                {providerUsed && (
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      providerUsed === 'api'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {providerUsed === 'api' ? 'Google API' : 'Local Ollama'}
                  </span>
                )}
              </div>

              {resultText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Result</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Results Content */}
            <div className="flex-1 mt-3 overflow-y-auto">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs font-medium text-slate-500">
                    Gemma 4 is reading your notes and generating answers...
                  </p>
                </div>
              ) : resultText ? (
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {resultText}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                  <BookOpen className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                  <p className="text-sm font-medium text-slate-600">No summary yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Paste notes on the left or click any 1-Click sample above, then press{' '}
                    <strong>Summarize Notes</strong>.
                  </p>
                </div>
              )}
            </div>

            {resultText && modelUsed && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Model: <code className="font-mono text-slate-600">{modelUsed}</code></span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              </div>
            )}
          </div>

          {/* Helpful Beginner Guide Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 rounded-2xl border border-blue-100 text-xs text-slate-600">
            <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5 text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              How It Works & Setup Guide
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-600">
              <li className="flex items-start gap-1.5">
                <ChevronRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                <span><strong>Cloud Mode:</strong> Powered by Google's Gemma 4 model (<code className="font-mono bg-white px-1 py-0.5 rounded text-slate-700">gemma-4-31b-it</code>) via Gemini API.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ChevronRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                <span><strong>Local Fallback:</strong> Run offline with Ollama (<code className="font-mono bg-white px-1 py-0.5 rounded text-slate-700">gemma4:e2b</code>). Switch with <code className="font-mono bg-white px-1 py-0.5 rounded text-slate-700">PROVIDER=local</code>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ChevronRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                <span><strong>Smoke Test:</strong> Run <code className="font-mono bg-white px-1 py-0.5 rounded text-slate-700">npm run test:smoke</code> in the terminal to verify your connection anytime.</span>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
