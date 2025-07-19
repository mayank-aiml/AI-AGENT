import { documents, conversations, messages, documentChunks, type Document, type InsertDocument, type Conversation, type InsertConversation, type Message, type InsertMessage, type DocumentChunk } from "@shared/schema";

export interface IStorage {
  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  updateDocumentIndexed(id: number, isIndexed: boolean): Promise<void>;
  
  // Document Chunks
  createDocumentChunk(documentId: number, content: string, embedding: number[], chunkIndex: number): Promise<DocumentChunk>;
  searchSimilarChunks(queryEmbedding: number[], limit: number): Promise<(DocumentChunk & { document: Document })[]>;
  
  // Conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private documents: Map<number, Document> = new Map();
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, Message> = new Map();
  private documentChunks: Map<number, DocumentChunk & { document: Document }> = new Map();
  private currentDocId = 1;
  private currentConvId = 1;
  private currentMsgId = 1;
  private currentChunkId = 1;

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocId++;
    const document: Document = {
      ...insertDocument,
      id,
      isIndexed: insertDocument.isIndexed ?? false,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  async updateDocumentIndexed(id: number, isIndexed: boolean): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      this.documents.set(id, { ...doc, isIndexed });
    }
  }

  async createDocumentChunk(documentId: number, content: string, embedding: number[], chunkIndex: number): Promise<DocumentChunk> {
    const id = this.currentChunkId++;
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    
    const chunk: DocumentChunk = {
      id,
      documentId,
      content,
      embedding: embedding as any, // Vector type simulation
      chunkIndex,
    };
    
    this.documentChunks.set(id, { ...chunk, document });
    return chunk;
  }

  async searchSimilarChunks(queryEmbedding: number[], limit: number): Promise<(DocumentChunk & { document: Document })[]> {
    // Simple cosine similarity calculation for in-memory search
    const chunks = Array.from(this.documentChunks.values());
    const similarities = chunks.map(chunk => {
      const embedding = chunk.embedding as unknown as number[];
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      return { ...chunk, similarity };
    });
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConvId++;
    const conversation: Conversation = {
      ...insertConversation,
      id,
      title: insertConversation.title ?? null,
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMsgId++;
    const message: Message = {
      ...insertMessage,
      id,
      sources: insertMessage.sources ?? null,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const storage = new MemStorage();
