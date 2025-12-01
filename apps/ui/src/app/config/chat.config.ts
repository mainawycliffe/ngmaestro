import { AngularVersion, ModeOption } from '../models/chat.types';

export const ANGULAR_VERSIONS: AngularVersion[] = [
  { value: '21', label: 'Angular 21 (Latest)' },
  { value: '20', label: 'Angular 20' },
  { value: '19', label: 'Angular 19' },
  { value: '18', label: 'Angular 18' },
];

export const AVAILABLE_MODES: ModeOption[] = [
  { value: 'question', label: 'Ask Question', icon: 'help_outline' },
  { value: 'error', label: 'Paste Error', icon: 'error_outline' },
  { value: 'review', label: 'Code Review', icon: 'code' },
];
