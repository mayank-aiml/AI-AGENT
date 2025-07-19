import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { generateEmbedding } from "./openai";

// For DOCX processing  
import mammoth from "mammoth";

export async function processDocument(filePath: string, originalName: string, fileType: string): Promise<void> {
  try {
    let content = "";
    
    switch (fileType.toLowerCase()) {
      case "pdf":
        // For now, we'll handle PDFs as text files that need manual extraction
        // In production, you'd want to integrate a proper PDF parser
        throw new Error("PDF processing temporarily disabled. Please convert to text format.");
      case "docx":
        content = await processDOCX(filePath);
        break;
      case "txt":
      case "md":
        content = await fs.promises.readFile(filePath, "utf-8");
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Create document record
    const document = await storage.createDocument({
      filename: path.basename(filePath),
      originalName,
      fileType,
      content,
      isIndexed: false,
    });

    // Process document into chunks and generate embeddings
    await chunkAndIndexDocument(document.id, content);
    
    // Mark as indexed
    await storage.updateDocumentIndexed(document.id, true);
    
    // Clean up uploaded file
    await fs.promises.unlink(filePath);
    
  } catch (error) {
    console.error("Error processing document:", error);
    // Clean up file on error
    try {
      await fs.promises.unlink(filePath);
    } catch (cleanupError) {
      console.error("Error cleaning up file:", cleanupError);
    }
    throw error;
  }
}



async function processDOCX(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function chunkAndIndexDocument(documentId: number, content: string): Promise<void> {
  // Split content into chunks (roughly 500 words each)
  const chunks = splitIntoChunks(content, 500);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.trim().length > 0) {
      try {
        const embedding = await generateEmbedding(chunk);
        await storage.createDocumentChunk(documentId, chunk, embedding, i);
      } catch (error) {
        console.error(`Failed to process chunk ${i} for document ${documentId}:`, error);
        // Continue processing other chunks
      }
    }
  }
}

function splitIntoChunks(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWords) {
    const chunk = words.slice(i, i + maxWords).join(" ");
    chunks.push(chunk);
  }
  
  return chunks;
}
