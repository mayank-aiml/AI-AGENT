import OpenAI from "openai";

// Configure API based on available keys
const useDeepSeek = process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "default_key",
});

// DeepSeek client configuration
const deepseek = useDeepSeek ? new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
}) : null;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // For now, embeddings require OpenAI as DeepSeek doesn't provide embeddings API
    if (useDeepSeek) {
      throw new Error("Document embedding requires OpenAI API key. DeepSeek doesn't provide embedding models.");
    }
    
    const response = await openai.embeddings.create({
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

    const client = useDeepSeek ? deepseek! : openai;
    const model = useDeepSeek ? "deepseek-chat" : "gpt-4o";

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
    });

    return response.choices[0].message.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const client = useDeepSeek ? deepseek! : openai;
    const model = useDeepSeek ? "deepseek-chat" : "gpt-4o";

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
