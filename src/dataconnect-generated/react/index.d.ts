import { CreateUserData, CreateUserVariables, GetGenerationsByUserData, GetGenerationsByUserVariables, CreateCommentData, CreateCommentVariables, ListPublicGenerationsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;

export function useGetGenerationsByUser(vars: GetGenerationsByUserVariables, options?: useDataConnectQueryOptions<GetGenerationsByUserData>): UseDataConnectQueryResult<GetGenerationsByUserData, GetGenerationsByUserVariables>;
export function useGetGenerationsByUser(dc: DataConnect, vars: GetGenerationsByUserVariables, options?: useDataConnectQueryOptions<GetGenerationsByUserData>): UseDataConnectQueryResult<GetGenerationsByUserData, GetGenerationsByUserVariables>;

export function useCreateComment(options?: useDataConnectMutationOptions<CreateCommentData, FirebaseError, CreateCommentVariables>): UseDataConnectMutationResult<CreateCommentData, CreateCommentVariables>;
export function useCreateComment(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCommentData, FirebaseError, CreateCommentVariables>): UseDataConnectMutationResult<CreateCommentData, CreateCommentVariables>;

export function useListPublicGenerations(options?: useDataConnectQueryOptions<ListPublicGenerationsData>): UseDataConnectQueryResult<ListPublicGenerationsData, undefined>;
export function useListPublicGenerations(dc: DataConnect, options?: useDataConnectQueryOptions<ListPublicGenerationsData>): UseDataConnectQueryResult<ListPublicGenerationsData, undefined>;
