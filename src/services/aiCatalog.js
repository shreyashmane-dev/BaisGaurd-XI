export const AI_PROVIDERS = [
  { id: "gemini", label: "Google Gemini", icon: "diamond" },
  { id: "openai", label: "OpenAI", icon: "bolt" },
  { id: "claude", label: "Anthropic Claude", icon: "auto_awesome" },
];

export const AI_MODELS = [
  {
    id: "gemini-flash",
    providerId: "gemini",
    label: "Gemini Flash",
    shortLabel: "Gemini",
    icon: "diamond",
    description: "Fast reasoning for primary fairness review.",
  },
  {
    id: "gemini-pro",
    providerId: "gemini",
    label: "Gemini Pro",
    shortLabel: "Gemini Pro",
    icon: "diamond",
    description: "Deep multi-step synthesis and explanation.",
  },
  {
    id: "openai-gpt4o-mini",
    providerId: "openai",
    label: "GPT-4o Mini",
    shortLabel: "GPT-4o",
    icon: "bolt",
    description: "Strong structured reasoning and decision critique.",
  },
  {
    id: "claude-sonnet",
    providerId: "claude",
    label: "Claude Sonnet",
    shortLabel: "Claude",
    icon: "auto_awesome",
    description: "Nuanced policy and ethics-oriented review.",
  },
];

export function getModelMeta(modelId) {
  return AI_MODELS.find((model) => model.id === modelId) || null;
}

export function getProviderMeta(providerId) {
  return AI_PROVIDERS.find((provider) => provider.id === providerId) || null;
}
