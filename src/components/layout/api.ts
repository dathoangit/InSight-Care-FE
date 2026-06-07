import { type AuthenticatedApi } from 'src/api/authenticated';

import { type LayoutFloor } from './types';

export function getLayout(api: AuthenticatedApi): Promise<LayoutFloor[]> {
  return api.get<LayoutFloor[]>('/layout');
}
