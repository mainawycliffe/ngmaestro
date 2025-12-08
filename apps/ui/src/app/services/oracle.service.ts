import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, Observable } from 'rxjs';
import { ChatBlock, ConfidenceMetadata } from '../models/chat.types';

export interface OracleInput {
  query: string;
  angularVersion: string;
  mode: 'question' | 'error' | 'review';
  image?: string;
  learningMode?: boolean;
  history?: { role: 'user' | 'model'; content: string | ChatBlock[] }[];
}

export interface OracleResponse {
  response: {
    blocks: ChatBlock[];
    confidence: ConfidenceMetadata;
  };
}

@Injectable({
  providedIn: 'root',
})
export class OracleService {
  private functions = inject(Functions);

  generate(input: OracleInput): Observable<OracleResponse> {
    const theOracle = httpsCallable<OracleInput, OracleResponse>(
      this.functions,
      'theOracle',
    );
    return from(theOracle(input).then((r) => r.data));
  }
}
