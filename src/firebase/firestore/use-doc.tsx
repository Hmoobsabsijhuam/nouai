'use client';

import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

// Type for the memoized Firestore document reference.
type MemoizedDocumentReference<T = DocumentData> = DocumentReference<T> & { __memo?: boolean };

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * 
 * IMPORTANT: The document reference passed to this hook MUST be memoized
 * using the `useMemoFirebase` hook to prevent unnecessary re-renders and
 * potential performance issues.
 * 
 * @template T The expected type of the document data.
 * @param {MemoizedDocumentReference | null | undefined} memoizedDocRef - The memoized
 * Firestore DocumentReference. The hook will not execute if this is null or undefined.
 * @returns {UseDocResult<T>} An object containing the document data, loading state, and any error.
 */
export function useDoc<T = any>(
  memoizedDocRef: MemoizedDocumentReference | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist, which is a valid state.
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Propagate the error for global handling.
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  // Enforce the use of useMemoFirebase for the document reference.
  if (memoizedDocRef && !memoizedDocRef.__memo) {
    throw new Error('Document reference passed to useDoc must be memoized with useMemoFirebase.');
  }

  return { data, isLoading, error };
}
