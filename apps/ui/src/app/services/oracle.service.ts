import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface OracleInput {
  query: string;
  angularVersion: string;
  mode: 'question' | 'error' | 'review';
}

export interface OracleResponse {
  response: string;
  sources?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class OracleService {
  private functions = inject(Functions);

  ask(input: OracleInput): Observable<OracleResponse> {
    const theOracle = httpsCallable<OracleInput, OracleResponse>(
      this.functions,
      'theOracle'
    );
    return from(theOracle(input)).pipe(map((result) => result.data));
  }
}
