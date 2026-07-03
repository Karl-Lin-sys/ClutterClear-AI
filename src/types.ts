export interface UIMessage {
  id: string;
  role: "user" | "model";
  text?: string;
  imageUrl?: string;
}

export interface GenAIPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GenAIMessage {
  role: "user" | "model";
  parts: GenAIPart[];
}
