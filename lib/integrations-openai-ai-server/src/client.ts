import OpenAI from "openai";

let client: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseURL || !apiKey) {
    throw new Error(
      "OpenAI integration is not configured. Set AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY.",
    );
  }

  client ??= new OpenAI({ apiKey, baseURL });
  return client;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, property) {
    const configuredClient = getOpenAI();
    const value = Reflect.get(configuredClient, property, configuredClient);
    return typeof value === "function" ? value.bind(configuredClient) : value;
  },
});
