export interface Character {
  id?: number; // Auto-incremented ID from Dexie
  name: string;
  avatar?: string; // Base64 string or URL
  description: string; // Short description
  
  // Personality & Prompt Engineering
  systemPrompt: string; // The core personality instructions
  tags: string[]; // e.g., ["Tsundere", "Maid", "Magic"]
  firstMessage: string; // The initial greeting
  
  // Example dialogues for few-shot learning
  examples: {
    user: string;
    assistant: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_CHARACTER_TAGS = [
  "Tsundere",
  "Yandere",
  "Kuudere",
  "Genki",
  "Maid",
  "Onee-san",
  "Imouto",
  "Fantasy",
  "School",
  "Sci-Fi"
];
