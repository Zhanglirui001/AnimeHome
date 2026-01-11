// Frontend API Client to talk to Python Backend
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export interface Character {
  id?: number;
  name: string;
  avatar?: string;
  description: string;
  system_prompt: string;
  tags: string[];
  first_message: string;
  examples: { user: string; assistant: string }[];
}

export const api = {
  characters: {
    list: async (signal?: AbortSignal) => {
      const res = await fetch(`${API_BASE_URL}/characters/`, { signal });
      if (!res.ok) throw new Error('Failed to fetch characters');
      return res.json();
    },
    get: async (id: number, signal?: AbortSignal) => {
      const res = await fetch(`${API_BASE_URL}/characters/${id}`, { signal });
      if (!res.ok) throw new Error('Failed to fetch character');
      return res.json();
    },
    create: async (character: Omit<Character, 'id'>) => {
      // Ensure field names match backend expectation (camelCase vs snake_case handled here?)
      // Actually backend expects: system_prompt, first_message. Frontend uses camelCase often.
      // Let's map it.
      const payload = {
        ...character,
        system_prompt: character.system_prompt, // already snake_case in interface?
        first_message: character.first_message,
      };
      
      const res = await fetch(`${API_BASE_URL}/characters/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create character');
      return res.json();
    },
    update: async (id: number, character: Partial<Character>) => {
       const res = await fetch(`${API_BASE_URL}/characters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character),
      });
      if (!res.ok) throw new Error('Failed to update character');
      return res.json();
    },
    delete: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/characters/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete character');
      return res.json();
    }
  },
  chat: {
     // Chat is special because it's streaming. 
     // We will likely point useChat to the backend URL directly.
     endpoint: `${API_BASE_URL}/chat/`
  },
  messages: {
    list: async (characterId: number, signal?: AbortSignal) => {
      const res = await fetch(`${API_BASE_URL}/characters/${characterId}/messages`, { signal });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    create: async (characterId: number, message: { id: string; role: 'user' | 'assistant'; content: string }) => {
      const res = await fetch(`${API_BASE_URL}/characters/${characterId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      if (!res.ok) throw new Error('Failed to create message');
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/messages/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete message');
      return res.json();
    },
    batchDelete: async (ids: string[]) => {
      const res = await fetch(`${API_BASE_URL}/messages/batch_delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });
      if (!res.ok) throw new Error('Failed to batch delete messages');
      return res.json();
    }
  },
  upload: {
    avatar: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/upload/avatar`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload avatar');
      return res.json();
    }
  }
};
