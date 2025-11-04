import {
  createDbBuckets,
  type DatabaseBucket,
  type DatabaseBucketOperations,
} from '~/common/database/database-buckets';

export const readyMessage = {
  type: 'ready',
} as const;
export interface ErrorMessage {
  type: 'error';
  error: string;
}

process.parentPort.once('message', async message => {
  const { dbConfig: defaultConfig, dbPath } = message.data;

  const buckets = createDbBuckets(dbPath, defaultConfig);

  message.ports.forEach(port => {
    port.on('message', async message => {
      /**
       * id: the unique identifier for the request
       * type: the database type (e.g., 'User', 'Request', etc.)
       * func: the database operation to perform (e.g., 'find', 'insert', etc.)
       * args: the arguments for the database operation
       */
      const { id, type, func, args } = message.data as {
        id: string;
        type: keyof typeof buckets;
        func: DatabaseBucketOperations;
        args: Parameters<DatabaseBucket[DatabaseBucketOperations]>;
      };

      console.debug('[debug]', '[db-process]', 'onMessage', id, Date.now());

      try {
        const dbBucket = buckets[type];
        // console.log(type, func, ...args);
        const result = await (dbBucket[func] as any)(...args);

        console.debug('[debug]', '[db-process]', 'postMessage', id, Date.now());
        port.postMessage({
          type: 'response',
          id,
          result,
        });
      } catch (error) {
        port.postMessage({
          id,
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    port.start();
    port.postMessage(readyMessage);
  });
});
