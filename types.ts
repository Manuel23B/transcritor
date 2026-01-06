export enum Language {
  AUTO = 'Auto-detectar',
  PT_BR = 'Português (Brasil)',
  EN_US = 'Inglês (US)',
  ES = 'Espanhol',
  FR = 'Francês',
  DE = 'Alemão',
  IT = 'Italiano',
  JA = 'Japonês',
  ZH = 'Chinês (Mandarim)'
}

export interface TranscriptionState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  text: string | null;
  error: string | null;
}

export interface FileData {
  file: File;
  previewUrl: string | null;
  type: 'audio' | 'video';
}

export interface HistoryItem {
  id: string;
  fileName: string;
  date: string; // ISO string
  text: string;
  language: string;
}