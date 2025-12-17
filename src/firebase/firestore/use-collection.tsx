
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

// Internal type representing the structure of a Firestore query object.
interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    };
  };
}

// Type for the memoized Firestore query or collection reference.
type MemoizedFirestoreQuery<T = DocumentData> = (CollectionReference<T> | Query<T>) & { __memo?: boolean };

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * 
 * IMPORTANT: The query or reference passed to this hook MUST be memoized
 * using the `useMemoFirebase` hook to prevent unnecessary re-renders and
 * potential performance issues.
 * 
 * @template T The expected type of the document data.
 * @param {MemoizedFirestoreQuery | null | undefined} memoizedTargetRefOrQuery - The memoized
 * Firestore CollectionReference or Query. The hook will not execute if this is null or undefined.
 * @returns {UseCollectionResult<T>} An object containing the collection data, loading state, and any error.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: MemoizedFirestoreQuery | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => (
          { ...(doc.data() as T), id: doc.id }
        ));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const path = memoizedTargetRefOrQuery.type === 'collection'
          ? (memoizedTargetRefOrQuery as CollectionReference).path
          : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Propagate the error for global handling.
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  // Enforce the use of useMemoFirebase for the query/reference.
  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    // console.error('Query or reference passed to useCollection was not memoized with useMemoFirebase.', memoizedTargetRefOrQuery)
    throw new Error('Query or reference passed to useCollection must be memoized with useMemoFirebase.');
  }

  return { data, isLoading, error };
}
