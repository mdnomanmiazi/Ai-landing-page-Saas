export const PRICING_RATES: Record<string, { input: number; output: number }> = {
  // Rate per 1 Million Tokens
  'gpt-5.1': { input: 1.25, output: 10.00 },
  'gpt-5': { input: 1.25, output: 10.00 },
  'gpt-5-mini': { input: 0.25, output: 2.00 },
  'gpt-5-nano': { input: 0.05, output: 0.40 },
  'gpt-5-pro': { input: 15.00, output: 120.00 },
  
  'gpt-4.1': { input: 2.00, output: 8.00 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'gpt-4.1-nano': { input: 0.10, output: 0.40 },
  
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4': { input: 30.00, output: 60.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  
  // Fallbacks for Codex/Variants (mapping to base models)
  'gpt-5.1-codex': { input: 1.25, output: 10.00 },
  'gpt-5-codex': { input: 1.25, output: 10.00 },
  'gpt-5.1-codex-mini': { input: 0.25, output: 2.00 },
  'codex-mini-latest': { input: 0.25, output: 2.00 },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number) {
  const rate = PRICING_RATES[model] || PRICING_RATES['gpt-4o']; // Default to gpt-4o if unknown
  
  const inputCost = (inputTokens / 1_000_000) * rate.input;
  const outputCost = (outputTokens / 1_000_000) * rate.output;
  
  return inputCost + outputCost;
}
