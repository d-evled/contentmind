export type Role = "user" | "assistant";

export type DocumentStatus = "processing" | "ready" | "error";

export interface Document {
  id: string;
  userId: string;
  name: string;
  status: DocumentStatus;
  createdAt: Date;
}

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  index: number;          // 0-based position within the document
  content: string;
  embedding: number[];    // length 768 (Gemini text-embedding-004)
}

/** A retrieved chunk paired with its similarity score. */
export interface ScoredChunk {
  chunk: Chunk;
  score: number;          // cosine similarity in [-1, 1]
}

export interface Citation {
  marker: number;         // 1-based index the model used, e.g. [1]
  chunkId: string;
  documentId: string;
  documentName: string;
  quote: string;
}

export type ToolName = "searchDocuments" | "extractFields";

export type ToolStatus = "pending" | "running" | "result" | "error";

export interface ToolCall {
  id: string;
  name: ToolName;
  status: ToolStatus;
  args: unknown;
  result?: unknown;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  citations?: Citation[];
  toolCalls?: ToolCall[];
  createdAt: Date;
}
