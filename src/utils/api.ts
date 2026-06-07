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
  const url = new URL(endPoint, api || 'http://localhost');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Keep original behavior when api is not provided: return relative endpoint URL.
  if (!api) {
    return `${url.pathname}${url.search}`;
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

export const apiGet = async <TResponse = unknown>({
  api = process.env.NEXT_PUBLIC_API_URL || '',
  endPoint,
  params,
  token,
}: ApiGetOptions): Promise<TResponse> => {
  const response = await fetch(buildUrl({ api, endPoint, params }), {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
  api = process.env.NEXT_PUBLIC_API_URL || '',
  endPoint,
  body,
  token,
}: ApiPostOptions<TBody>): Promise<TResponse> => {
  const response = await fetch(buildUrl({ api, endPoint }), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
