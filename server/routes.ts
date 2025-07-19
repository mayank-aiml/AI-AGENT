import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertConversationSchema } from "@shared/schema";
import { generateEmbedding, generateAnswer, generateConversationTitle } from "./services/openai";
import { processDocument } from "./services/documentProcessor";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [".docx", ".txt", ".md"]; // Temporarily removed PDF
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only DOCX, TXT, and MD files are supported currently."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Upload document
  app.post("/api/documents", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();
      
      // Process document asynchronously
      processDocument(req.file.path, req.file.originalname, fileType)
        .catch(error => console.error("Background document processing failed:", error));

      res.json({ 
        message: "Document uploaded successfully and is being processed",
        filename: req.file.originalname 
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Get document stats
  app.get("/api/documents/stats", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      const totalDocs = documents.length;
      const indexedDocs = documents.filter(doc => doc.isIndexed).length;
      
      res.json({
        totalDocs,
        indexedDocs,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document stats" });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Create conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Invalid conversation data" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message and get AI response
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        content,
        role: "user",
        sources: null,
      });

      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(content);
      
      // Search for similar document chunks
      const similarChunks = await storage.searchSimilarChunks(queryEmbedding, 5);
      
      // Extract context and source documents
      const context = similarChunks.map(chunk => chunk.content);
      const sourceDocuments = Array.from(new Set(similarChunks.map(chunk => chunk.document)));
      
      // Generate AI response
      const aiResponse = await generateAnswer(content, context);
      
      // Save AI message with sources
      const aiMessage = await storage.createMessage({
        conversationId,
        content: aiResponse,
        role: "assistant",
        sources: JSON.stringify(sourceDocuments.map(doc => ({
          id: doc.id,
          originalName: doc.originalName,
          fileType: doc.fileType,
        }))),
      });

      // Update conversation title if this is the first message
      const allMessages = await storage.getMessagesByConversation(conversationId);
      if (allMessages.length === 2) { // User message + AI response
        const title = await generateConversationTitle(content);
        // Note: We would need to add updateConversation to storage interface for this
      }

      res.json({
        userMessage,
        aiMessage,
        sources: sourceDocuments.map(doc => ({
          id: doc.id,
          originalName: doc.originalName,
          fileType: doc.fileType,
        })),
      });

    } catch (error) {
      console.error("Message error:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
