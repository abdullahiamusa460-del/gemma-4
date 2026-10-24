/**
 * Smoke test script for Gemma 4 AI Assistant.
 * Sends realistic sample notes through the active provider (API or Local Ollama)
 * and verifies that a non-empty, valid response is returned.
 *
 * Prints PASS or FAIL.
 */

import dotenv from 'dotenv';
import { runGemma } from './server.ts';

dotenv.config();

// Realistic sample input: high-school biology notes on Photosynthesis
const SAMPLE_INPUT = `
Biology Study Notes: Cellular Energy and Photosynthesis
Date: October 2026

1. Definition:
Photosynthesis is the biochemical process by which green plants, algae, and cyanobacteria transform solar light energy into stable chemical energy stored in glucose molecules.

2. Inputs and Outputs:
- Reactants: Carbon dioxide (6 CO2) from the air, water (6 H2O) absorbed by roots, and photon energy from sunlight.
- Products: Glucose sugar (C6H12O6) used for plant growth, and diatomic oxygen (6 O2) released into the atmosphere.
- Equation: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2

3. Two Main Stages:
- Light-Dependent Reactions: Occur inside chloroplast thylakoid membranes where chlorophyll absorbs photons, splits water molecules, and creates ATP and NADPH.
- Light-Independent Reactions (Calvin Cycle): Occurs in the chloroplast stroma, using stored ATP and NADPH to convert carbon dioxide into sugar.

4. Planetary Significance:
Maintains breathable atmospheric oxygen and forms the base trophic layer for nearly all food chains on Earth.
`.trim();

async function runSmokeTest() {
  // Support CLI arguments: tsx smoke-test.ts --provider=local OR --provider=api
  const args = process.argv.slice(2);
  let providerArg: 'api' | 'local' | undefined = undefined;
  for (const arg of args) {
    if (arg.startsWith('--provider=')) {
      const val = arg.split('=')[1].toLowerCase();
      if (val === 'api' || val === 'local') {
        providerArg = val;
      }
    }
  }

  const activeProvider = providerArg || (process.env.PROVIDER?.toLowerCase() === 'local' ? 'local' : 'api');

  console.log('====================================================');
  console.log('              GEMMA 4 SMOKE TEST                    ');
  console.log('====================================================');
  console.log(`Target Provider:  ${activeProvider.toUpperCase()}`);
  if (activeProvider === 'local') {
    console.log(`Local Host:       ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
    console.log(`Local Model:      ${process.env.OLLAMA_MODEL || 'gemma4:e2b'}`);
  } else {
    console.log(`API Model:        ${process.env.GEMMA_API_MODEL || 'gemma-4-31b-it'}`);
    console.log(`API Key Set:      ${Boolean(process.env.GEMINI_API_KEY) ? 'Yes' : 'No'}`);
  }
  console.log('----------------------------------------------------');
  console.log('Sending realistic sample input (Photosynthesis Notes)...');

  const startTime = Date.now();

  try {
    const result = await runGemma({
      prompt: `Please provide a simple, 2-bullet point summary of these biology notes:\n\n${SAMPLE_INPUT}`,
      systemInstruction: 'You are a simple, clear educational assistant powered by Gemma 4. Use beginner-friendly language.',
      provider: activeProvider,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!result || !result.text || result.text.trim().length < 15) {
      console.error('\nReceived empty or invalid response from model.');
      console.log('\nResult: FAIL');
      process.exit(1);
    }

    console.log('\n--- Model Response Preview ---');
    console.log(result.text.trim());
    console.log('------------------------------');
    console.log(`Model Used:       ${result.model}`);
    console.log(`Duration:         ${duration}s`);
    console.log('\nResult: PASS');
    process.exit(0);
  } catch (error: any) {
    console.error('\nSmoke test encountered an error:');
    console.error(error.message || error);
    console.log('\nResult: FAIL');
    process.exit(1);
  }
}

runSmokeTest();
