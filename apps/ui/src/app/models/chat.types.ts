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

export interface DocSource {
  title: string;
  url: string;
  source: 'angular' | 'material' | 'ngrx' | 'analogjs';
}

export interface ConfidenceMetadata {
  overall_confidence: number;
  docs_confidence?: number;
  answer_confidence?: number;
  concerns?: string[];
  related_topics?: string[];
  sources?: DocSource[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string | ChatBlock[];
  image?: string;
  confidence?: ConfidenceMetadata;
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
