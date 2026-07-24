import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ChatMessageInput, ChatResponse, ErrorResponse, HealthStatus, SuggestedQuestionsResponse } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendChatMessageUrl: () => string;
/**
 * Sends a user message and receives an AI-generated answer from the Excel knowledge base
 * @summary Send a chat message to the AI assistant
 */
export declare const sendChatMessage: (chatMessageInput: ChatMessageInput, options?: RequestInit) => Promise<ChatResponse>;
export declare const getSendChatMessageMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
        data: BodyType<ChatMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
    data: BodyType<ChatMessageInput>;
}, TContext>;
export type SendChatMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendChatMessage>>>;
export type SendChatMessageMutationBody = BodyType<ChatMessageInput>;
export type SendChatMessageMutationError = ErrorType<ErrorResponse>;
/**
* @summary Send a chat message to the AI assistant
*/
export declare const useSendChatMessage: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
        data: BodyType<ChatMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
    data: BodyType<ChatMessageInput>;
}, TContext>;
export declare const getGetSuggestedQuestionsUrl: () => string;
/**
 * Returns a list of sample questions from the الاستفسارات Excel file
 * @summary Get suggested questions from the knowledge base
 */
export declare const getSuggestedQuestions: (options?: RequestInit) => Promise<SuggestedQuestionsResponse>;
export declare const getGetSuggestedQuestionsQueryKey: () => readonly ["/api/suggested-questions"];
export declare const getGetSuggestedQuestionsQueryOptions: <TData = Awaited<ReturnType<typeof getSuggestedQuestions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSuggestedQuestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSuggestedQuestions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSuggestedQuestionsQueryResult = NonNullable<Awaited<ReturnType<typeof getSuggestedQuestions>>>;
export type GetSuggestedQuestionsQueryError = ErrorType<unknown>;
/**
 * @summary Get suggested questions from the knowledge base
 */
export declare function useGetSuggestedQuestions<TData = Awaited<ReturnType<typeof getSuggestedQuestions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSuggestedQuestions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map