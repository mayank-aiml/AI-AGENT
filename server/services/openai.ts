import OpenAI from "openai";

// Configure API based on available keys
// Priority: OpenRouter > OpenAI > DeepSeek
const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
const useDeepSeek = !!process.env.DEEPSEEK_API_KEY && !useOpenRouter;
const useOpenAI = !!process.env.OPENAI_API_KEY && !useOpenRouter && !useDeepSeek;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "invalid_key",
});

// OpenRouter client configuration
const openrouter = useOpenRouter ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
}) : null;

// DeepSeek client configuration
const deepseek = useDeepSeek ? new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
}) : null;

const apiProvider = useOpenRouter ? 'OpenRouter' : useDeepSeek ? 'DeepSeek' : 'OpenAI';
console.log(`Using API: ${apiProvider}`);

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // OpenRouter and OpenAI support embeddings, DeepSeek doesn't
    if (useDeepSeek) {
      throw new Error("Document embedding requires OpenAI or OpenRouter API key. DeepSeek doesn't provide embedding models.");
    }
    
    const client = useOpenRouter ? openrouter! : openai;
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export async function generateAnswer(query: string, context: string[]): Promise<string> {
  try {
    const contextText = context.join("\n\n");
    const prompt = `Based on the following context from internal documents, answer the user's question. If the context doesn't contain enough information to answer the question, say so clearly.

Context:
${contextText}

Question: ${query}

Please provide a helpful, accurate answer based on the context provided.`;

    const client = useOpenRouter ? openrouter! : useDeepSeek ? deepseek! : openai;
    const model = useOpenRouter ? "openai/gpt-4o" : useDeepSeek ? "deepseek-chat" : "gpt-4o";

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a helpful internal documentation assistant. Provide clear, accurate answers based on the context provided from company documents."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000, // Limit tokens to reduce cost
    });

    return response.choices[0].message.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const client = useOpenRouter ? openrouter! : useDeepSeek ? deepseek! : openai;
    const model = useOpenRouter ? "openai/gpt-4o" : useDeepSeek ? "deepseek-chat" : "gpt-4o";

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "Generate a short, descriptive title (max 6 words) for a conversation based on the first message. Return only the title."
        },
        {
          role: "user",
          content: firstMessage
        }
      ],
      temperature: 0.5,
      max_tokens: 20,
    });

    return response.choices[0].message.content?.trim() || "New Conversation";
  } catch (error) {
    console.error("Failed to generate title:", error);
    return "New Conversation";
  }
}
