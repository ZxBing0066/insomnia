import type NeDB from '@seald-io/nedb';

import type { DatabaseBucket, DatabaseBuckets } from '~/common/database/database-buckets';

export type { DatabaseBucket };
export type DataBaseOptions = NeDB.DataStoreOptions;
export type DatabaseFactory = <T>(type: string, config?: DataBaseOptions) => DatabaseBucket<T>;
export type DatabaseBucketsFactory = (options?: DataBaseOptions) => Promise<DatabaseBuckets>;
