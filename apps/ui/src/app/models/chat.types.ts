export type Mode = 'question' | 'error' | 'review';

export interface AngularVersion {
  value: string;
  label: string;
}

export interface ModeOption {
  value: Mode;
  label: string;
  icon: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string | ChatBlock[];
  image?: string;
}

export type ChatBlock = TextBlock | CodeBlock;

export interface TextBlock {
  type: 'text';
  content: string;
}

export interface CodeBlock {
  type: 'code';
  language: string;
  content: string;
  filename?: string;
}
