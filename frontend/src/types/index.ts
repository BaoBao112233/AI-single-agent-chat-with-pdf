export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  sessionId: number;
  userId: number;
  messages: Message[];
  lastActivity: Date;
  pdfUploaded?: boolean;
  pdfFileName?: string;
}

export interface ChatRequest {
  session_id: number;
  user_id: number;
  message: string;
}

export interface ChatResponse {
  session_id: number;
  user_id: number;
  response: string;
  error_status: string;
}

export interface UploadResponse {
  session_id?: number;
  user_id?: number;
  response: string;
  error_status: string;
}

export interface APIError {
  message: string;
  status?: number;
}
