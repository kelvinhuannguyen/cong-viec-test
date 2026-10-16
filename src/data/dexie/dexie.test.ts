import { describeRepositoryContract } from '../repositoryContract';
import { createDexieRepositories } from './createDexieRepositories';
import { AppDatabase } from './db';

describeRepositoryContract('Dexie', (now) =>
  createDexieRepositories(new AppDatabase(`test-${crypto.randomUUID()}`), now),
);
