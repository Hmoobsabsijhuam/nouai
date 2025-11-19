import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CollectionItem_Key {
  collectionId: UUIDString;
  generationId: UUIDString;
  __typename?: 'CollectionItem_Key';
}

export interface Collection_Key {
  id: UUIDString;
  __typename?: 'Collection_Key';
}

export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreateCommentData {
  comment_insert: Comment_Key;
}

export interface CreateCommentVariables {
  generationId: UUIDString;
  content: string;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  displayName: string;
  email?: string | null;
  photoUrl?: string | null;
}

export interface Generation_Key {
  id: UUIDString;
  __typename?: 'Generation_Key';
}

export interface GetGenerationsByUserData {
  generations: ({
    id: UUIDString;
    createdAt: TimestampString;
    isPublic?: boolean | null;
    parameters?: string | null;
    prompt: string;
    type: string;
    url: string;
  } & Generation_Key)[];
}

export interface GetGenerationsByUserVariables {
  userId: UUIDString;
}

export interface Like_Key {
  userId: UUIDString;
  generationId: UUIDString;
  __typename?: 'Like_Key';
}

export interface ListPublicGenerationsData {
  generations: ({
    id: UUIDString;
    createdAt: TimestampString;
    prompt: string;
    type: string;
    url: string;
  } & Generation_Key)[];
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface GetGenerationsByUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetGenerationsByUserVariables): QueryRef<GetGenerationsByUserData, GetGenerationsByUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetGenerationsByUserVariables): QueryRef<GetGenerationsByUserData, GetGenerationsByUserVariables>;
  operationName: string;
}
export const getGenerationsByUserRef: GetGenerationsByUserRef;

export function getGenerationsByUser(vars: GetGenerationsByUserVariables): QueryPromise<GetGenerationsByUserData, GetGenerationsByUserVariables>;
export function getGenerationsByUser(dc: DataConnect, vars: GetGenerationsByUserVariables): QueryPromise<GetGenerationsByUserData, GetGenerationsByUserVariables>;

interface CreateCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
  operationName: string;
}
export const createCommentRef: CreateCommentRef;

export function createComment(vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;
export function createComment(dc: DataConnect, vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;

interface ListPublicGenerationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPublicGenerationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPublicGenerationsData, undefined>;
  operationName: string;
}
export const listPublicGenerationsRef: ListPublicGenerationsRef;

export function listPublicGenerations(): QueryPromise<ListPublicGenerationsData, undefined>;
export function listPublicGenerations(dc: DataConnect): QueryPromise<ListPublicGenerationsData, undefined>;

