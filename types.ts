
export type Role = 'user' | 'model';

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  parts: MessagePart[];
  timestamp: number;
}
