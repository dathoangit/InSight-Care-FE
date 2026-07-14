import { getPublicApiBaseUrl, joinApiUrl } from 'src/config/public-api';
import { notifyUnauthorized } from 'src/auth/unauthorized';

type PrimitiveValue = string | number | boolean;
type QueryValue = PrimitiveValue | null | undefined;
type QueryParams = Record<string, QueryValue>;

type ApiRequestBase = {
  api?: string;
  endPoint: string;
  token?: string;
};

type ApiGetOptions = ApiRequestBase & {
  params?: QueryParams;
};

type ApiPostOptions<TBody = unknown> = ApiRequestBase & {
  body?: TBody;
};

export type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  timestamp: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const buildUrl = ({
  api = '',
  endPoint,
  params,
}: ApiRequestBase & { params?: QueryParams }): string => {
  const resolvedApi = api || getPublicApiBaseUrl();
  const url = new URL(joinApiUrl(resolvedApi, endPoint));

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
};

export const unwrapApiResponseData = <TResponse>(payload: unknown): TResponse => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid API response format.');
  }

  const envelope = payload as Partial<ApiResponse<TResponse>>;
  if (
    typeof envelope.statusCode !== 'number' ||
    !('data' in envelope) ||
    typeof envelope.message !== 'string' ||
    typeof envelope.timestamp !== 'number'
  ) {
    throw new Error('Invalid API response format.');
  }

  return envelope.data as TResponse;
};

export const formatApiErrorPayload = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) {
    return null;
  }

  const { message } = payload as { message: unknown };
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message) && message.every((m) => typeof m === 'string')) {
    return message.join(' ');
  }

  return null;
};

const getErrorMessage = (response: Response, payload: unknown): string => {
  return formatApiErrorPayload(payload) || response.statusText || 'Request failed';
};

const handleUnauthorized = (status: number, token?: string): void => {
  if (status === 401 && token) {
    notifyUnauthorized();
  }
};

const buildRequestHeaders = (
  api: string,
  headers: Record<string, string> = {},
): Record<string, string> => {
  const nextHeaders = { ...headers };

  if (api.includes('ngrok')) {
    nextHeaders['ngrok-skip-browser-warning'] = 'true';
  }

  return nextHeaders;
};

export const apiGet = async <TResponse = unknown>({
  api,
  endPoint,
  params,
  token,
}: ApiGetOptions): Promise<TResponse> => {
  const resolvedApi = api ?? getPublicApiBaseUrl();
  const response = await fetch(buildUrl({ api: resolvedApi, endPoint, params }), {
    method: 'GET',
    headers: buildRequestHeaders(
      resolvedApi,
      token ? { Authorization: `Bearer ${token}` } : {},
    ),
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    handleUnauthorized(response.status, token);
    throw new ApiError(getErrorMessage(response, payload), response.status, payload);
  }

  if (response.status === 204) {
    return null as TResponse;
  }

  return unwrapApiResponseData<TResponse>(payload);
};

export const apiPost = async <TResponse = unknown, TBody = unknown>({
  api,
  endPoint,
  body,
  token,
}: ApiPostOptions<TBody>): Promise<TResponse> => {
  const resolvedApi = api ?? getPublicApiBaseUrl();
  const response = await fetch(buildUrl({ api: resolvedApi, endPoint }), {
    method: 'POST',
    headers: buildRequestHeaders(resolvedApi, {
      'Content-Type': 'application/json; charset=utf-8',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    handleUnauthorized(response.status, token);
    throw new ApiError(getErrorMessage(response, payload), response.status, payload);
  }

  if (response.status === 204) {
    return null as TResponse;
  }

  return unwrapApiResponseData<TResponse>(payload);
};
