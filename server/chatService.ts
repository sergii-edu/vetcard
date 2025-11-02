import OpenAI from "openai";
import type { Animal } from "@shared/schema";

export class ChatService {
  private openai: OpenAI;
  private assistantCache: Map<string, string> = new Map();
  private threadCache: Map<string, string> = new Map();

  constructor(openai: OpenAI) {
    this.openai = openai;
  }

  async sendMessage(
    animal: Animal,
    userMessage: string
  ): Promise<string> {
    try {
      if (!animal.vectorStoreId) {
        return "Для цієї тварини ще не створено базу знань. Спочатку додайте метрики здоров'я через OCR сканування або вручну.";
      }

      const assistantId = await this.getOrCreateAssistant(animal);
      const threadId = await this.getOrCreateThread(animal.id);
      
      await this.openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: userMessage,
      });

      const run = await (this.openai.beta.threads.runs as any).createAndPoll(threadId, {
        assistant_id: assistantId,
      });

      if (run.status === 'completed') {
        const messages = await this.openai.beta.threads.messages.list(threadId);
        const assistantMessage = messages.data.find(m => m.role === 'assistant');
        
        if (assistantMessage && assistantMessage.content[0]?.type === 'text') {
          return assistantMessage.content[0].text.value;
        }
      }

      throw new Error(`Assistant run failed with status: ${run.status}`);
    } catch (error) {
      console.error("Error in chat service:", error);
      throw error;
    }
  }

  private async getOrCreateThread(animalId: string): Promise<string> {
    if (this.threadCache.has(animalId)) {
      return this.threadCache.get(animalId)!;
    }

    const thread = await this.openai.beta.threads.create();
    this.threadCache.set(animalId, thread.id);
    return thread.id;
  }

  private async getOrCreateAssistant(animal: Animal): Promise<string> {
    const cacheKey = animal.id;
    
    if (this.assistantCache.has(cacheKey)) {
      return this.assistantCache.get(cacheKey)!;
    }

    const assistant = await (this.openai.beta.assistants as any).create({
      name: `${animal.name} Health Assistant`,
      instructions: `You are a helpful veterinary health assistant for ${animal.name}, a ${animal.species} (${animal.breed}). 
      
Your role is to:
- Answer questions about ${animal.name}'s health metrics and medical history
- Provide insights based on the available medical data
- Identify trends or concerning patterns in health metrics
- Explain medical terms in simple language
- Compare current values with reference ranges

Always:
- Be accurate and base responses on the available data
- Clearly state when you don't have enough information
- Use metric values with proper units
- Mention the date when referencing specific measurements
- Be supportive and informative

IMPORTANT: You are NOT a replacement for veterinary care. For serious health concerns, always recommend consulting with a veterinarian.`,
      model: "gpt-4o-mini",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [animal.vectorStoreId!]
        }
      }
    });

    this.assistantCache.set(cacheKey, assistant.id);
    return assistant.id;
  }

  async cleanup(animalId: string): Promise<void> {
    try {
      const assistantId = this.assistantCache.get(animalId);
      if (assistantId) {
        await (this.openai.beta.assistants as any).del(assistantId);
        this.assistantCache.delete(animalId);
      }
      
      const threadId = this.threadCache.get(animalId);
      if (threadId) {
        await (this.openai.beta.threads as any).del(threadId);
        this.threadCache.delete(animalId);
      }
    } catch (error) {
      console.error("Failed to cleanup assistant/thread:", error);
    }
  }
}
