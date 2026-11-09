import { type AuthenticatedApi } from 'src/api/authenticated';

import type {
  AdminLayoutBed,
  AdminLayoutFloor,
  CreateAdminBedBody,
  UpdateAdminBedBody,
} from './types';

export function getAdminLayout(
  api: AuthenticatedApi,
): Promise<AdminLayoutFloor[]> {
  return api.get<AdminLayoutFloor[]>('/admin/layout');
}

export function createAdminBed(
  api: AuthenticatedApi,
  body: CreateAdminBedBody,
): Promise<AdminLayoutBed> {
  return api.post<AdminLayoutBed, CreateAdminBedBody>('/admin/beds', body);
}

export function updateAdminBed(
  api: AuthenticatedApi,
  bedId: string,
  body: UpdateAdminBedBody,
): Promise<AdminLayoutBed> {
  return api.patch<AdminLayoutBed, UpdateAdminBedBody>(
    `/admin/beds/${bedId}`,
    body,
  );
}

export function closeAdminBed(
  api: AuthenticatedApi,
  bedId: string,
): Promise<AdminLayoutBed | Record<string, never>> {
  return api.delete<AdminLayoutBed | Record<string, never>>(
    `/admin/beds/${bedId}`,
  );
}
