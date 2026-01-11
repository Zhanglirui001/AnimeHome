import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Create an OpenAI provider instance but point it to Aliyun Qwen
const qwen = createOpenAI({
  baseURL: process.env.MODEL_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.MODEL_API_KEY,
});

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  // Construct the full message history
  // If a systemPrompt is provided, prepend it as a system message
  const coreMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  const result = await streamText({
    model: qwen(process.env.MODEL_NAME || 'qwen-max') as any,
    messages: coreMessages,
    temperature: Number(process.env.MODEL_TEMPERATURE) || 0.7,
  });

  return result.toTextStreamResponse();
}
