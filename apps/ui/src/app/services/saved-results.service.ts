import { inject, Injectable } from '@angular/core';
import {
  doc,
  Firestore,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SavedResult {
  slug: string;
  query: string;
  angularVersion: string;
  mode: 'question' | 'error' | 'review';
  response: {
    blocks: Array<
      | { type: 'text'; content: string }
      | {
          type: 'code';
          language: string;
          content: string;
          filename?: string;
        }
    >;
  };
  createdAt: string;
  viewCount: number;
  isPublic: boolean;
  metadata?: {
    validation?: {
      isValid: boolean;
      hasWarnings: boolean;
    };
    generationTime?: number;
    toolCallCount?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SavedResultsService {
  private firestore = inject(Firestore);

  /**
   * Generate URL-safe slug from query
   */
  generateSlug(query: string): string {
    return (
      query
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Remove consecutive hyphens
        .substring(0, 60) + // Limit length
      '-' +
      Date.now().toString(36)
    ); // Add timestamp for uniqueness
  }

  /**
   * Save a result to Firestore
   */
  saveResult(
    query: string,
    angularVersion: string,
    mode: 'question' | 'error' | 'review',
    response: SavedResult['response'],
    options?: {
      metadata?: SavedResult['metadata'];
    },
  ): Observable<{ slug: string; shareUrl: string }> {
    const slug = this.generateSlug(query);
    const resultRef = doc(this.firestore, 'savedResults', slug);

    // Build result object, only including optional fields if they have values
    const result: Omit<SavedResult, 'createdAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
    } = {
      slug,
      query,
      angularVersion,
      mode,
      response,
      createdAt: serverTimestamp(),
      viewCount: 0,
      isPublic: true,
      ...(options?.metadata && { metadata: options.metadata }),
    };

    return from(setDoc(resultRef, result)).pipe(
      map(() => ({
        slug,
        shareUrl: `${window.location.origin}/shared/${slug}`,
      })),
    );
  }

  /**
   * Get a saved result by slug
   */
  getResult(slug: string): Observable<SavedResult | null> {
    const resultRef = doc(this.firestore, 'savedResults', slug);

    return from(getDoc(resultRef)).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) {
          throw new Error('Result not found');
        }

        const data = snapshot.data() as SavedResult;

        // Increment view count asynchronously (don't wait)
        updateDoc(resultRef, {
          viewCount: increment(1),
        }).catch((error) => {
          console.error('Failed to increment view count:', error);
        });

        return data;
      }),
    );
  }

  /**
   * Copy share URL to clipboard
   */
  async copyShareUrl(slug: string): Promise<boolean> {
    const shareUrl = `${window.location.origin}/shared/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (error) {
      console.error('Failed to copy URL:', error);
      return false;
    }
  }
}
