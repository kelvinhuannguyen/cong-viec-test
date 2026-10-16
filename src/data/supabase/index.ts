import type { AuthService } from '../auth';
import type { Repositories } from '../repository';
import { createSupabaseAuth } from './auth';
import { getSupabaseClient } from './client';
import { createSupabaseRepositories } from './createSupabaseRepositories';

export interface SupabaseBackend {
  auth: AuthService;
  createRepositories(): Repositories;
}

export function createSupabaseBackend(url: string, publishableKey: string): SupabaseBackend {
  const client = getSupabaseClient(url, publishableKey);
  return {
    auth: createSupabaseAuth(client),
    createRepositories: () => createSupabaseRepositories(client),
  };
}
