import Dexie, { type EntityTable } from 'dexie';
import { Character } from '@/types/character';

export interface ChatMessage {
  id: string; // UUID from AI SDK
  characterId: number;
  role: 'system' | 'user' | 'assistant' | 'data';
  content: string;
  createdAt: Date;
}

const db = new Dexie('AnimeHomeDB') as Dexie & {
  characters: EntityTable<
    Character,
    'id'
  >;
  messages: EntityTable<
    ChatMessage,
    'id'
  >;
};

// Schema declaration:
db.version(2).stores({
  characters: '++id, name, tags, createdAt',
  messages: 'id, characterId, role, createdAt' // Indexed props
});

export { db };
