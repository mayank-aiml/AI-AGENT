# DocuMind - Internal Document Q&A Agent

## Overview

DocuMind is a full-stack web application that provides an intelligent document question-answering system for internal company documentation. Users can upload documents (PDF, DOCX, TXT, MD) which are processed, chunked, and embedded using OpenAI's embedding model. The system enables semantic search and AI-powered responses to questions about the uploaded documents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL support
- **File Processing**: Multer for file uploads with support for PDF, DOCX, TXT, and MD files
- **AI Integration**: OpenAI API for embeddings and chat completions

### Data Storage Solutions
- **Primary Database**: PostgreSQL with vector extension for storing documents, chunks, and embeddings
- **Vector Storage**: pgvector for semantic similarity search
- **File Storage**: Local filesystem with temporary upload directory
- **Session Storage**: In-memory storage for development (can be extended to PostgreSQL sessions)

## Key Components

### Document Management
- **Upload System**: Drag-and-drop file upload with progress tracking
- **Document Processing**: Automatic text extraction from various file formats
- **Chunking Strategy**: Text is split into manageable chunks for embedding generation
- **Indexing Pipeline**: Documents are processed asynchronously and marked as indexed when complete

### Chat Interface
- **Conversation Management**: Users can create multiple conversation threads
- **Message History**: Persistent storage of chat messages with role-based organization
- **Source Attribution**: AI responses include references to source documents
- **Real-time UI**: Live typing indicators and streaming response display

### Search & Retrieval
- **Semantic Search**: Vector similarity search using OpenAI embeddings
- **Context Assembly**: Relevant document chunks are gathered to provide context for AI responses
- **Relevance Scoring**: Similar chunks are ranked and filtered for optimal context

## Data Flow

1. **Document Upload**: User uploads documents through the web interface
2. **Processing Pipeline**: Files are parsed, text extracted, and split into chunks
3. **Embedding Generation**: Each chunk is converted to vector embeddings using OpenAI
4. **Storage**: Documents, chunks, and embeddings are stored in PostgreSQL
5. **Query Processing**: User questions are embedded and matched against stored vectors
6. **Response Generation**: Relevant context is sent to OpenAI for answer generation
7. **Display**: Responses are shown with source document references

## External Dependencies

### Core Dependencies
- **OpenAI API**: Text embeddings (text-embedding-3-small) and chat completions (gpt-4o)
- **Neon Database**: Serverless PostgreSQL with vector extension support
- **shadcn/ui**: Pre-built accessible UI components
- **Radix UI**: Headless UI primitives for complex components

### Development Tools
- **Vite**: Fast development server and build tool with HMR
- **Replit Integration**: Development environment support with error overlays
- **TypeScript**: Type safety across the entire application
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Module Replacement**: Instant updates during development
- **Environment Variables**: DATABASE_URL and OPENAI_API_KEY configuration

### Production Build
- **Frontend**: Static assets built and served from Express
- **Backend**: Compiled TypeScript bundle with external dependencies
- **Database**: PostgreSQL with required vector extensions
- **File Storage**: Configurable upload directory with cleanup policies

### Scalability Considerations
- **Database**: Vector operations can be resource-intensive at scale
- **File Processing**: Document parsing happens synchronously and may need queuing
- **API Limits**: OpenAI API rate limits may require request throttling
- **Storage**: Local file storage should be replaced with cloud storage for production

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and a focus on developer experience while maintaining production readiness.