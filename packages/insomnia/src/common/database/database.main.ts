import path from 'node:path';

import electron, { ipcMain, MessageChannelMain, type MessagePortMain, utilityProcess } from 'electron';
import { v4 as uuidv4 } from 'uuid';

import type { DatabaseBucketOperations, DatabaseBuckets } from '~/common/database/database-buckets';
import type { DatabaseBucket, DatabaseBucketsFactory, DataBaseOptions } from '~/common/database/interface';

export const channel = 'db';

export const readyMessage = {
  type: 'ready',
} as const;
export type ReadyMessage = typeof readyMessage;
export interface ErrorMessage {
  type: 'error';
  id: string;
  error: string;
}
export interface ResultMessage {
  type: 'response';
  id: string;
  result: any;
}

const isReadyMessage = (message: ReadyMessage | ResultMessage | ErrorMessage): message is ReadyMessage => {
  return message?.type === 'ready';
};
const isErrorMessage = (message: ReadyMessage | ResultMessage | ErrorMessage): message is ErrorMessage => {
  return message?.type === 'error';
};
const isResponseMessage = (message: ReadyMessage | ResultMessage | ErrorMessage): message is ResultMessage => {
  return message?.type === 'response';
};

function createPromiseResolvers<T>(): [Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void] {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return [promise, resolve!, reject!];
}

let bucketsProxy: DatabaseBuckets;

export const initDatabaseBuckets: DatabaseBucketsFactory = async (
  config: DataBaseOptions = {},
  // consumerProcessesMainPorts: MessagePortMain[] = [],
) => {
  const defaultConfig: DataBaseOptions = {
    autoload: true,
    corruptAlertThreshold: 0.9,
    ...config,
  };

  const { port1, port2 } = new MessageChannelMain();
  const dbProcess = utilityProcess.fork(path.join(__dirname, 'entry.db-process.min.js'), [], {
    env: process.env,
    serviceName: 'insomnia-db-process',
  });
  dbProcess.on('exit', (code: number) => {
    console.warn(`[debug] db process exited with code ${code}`);
    if (code !== 0) {
      console.error(`DB process exited with code ${code}. This may indicate an error in the db operation.`);
    }
  });

  // Send one end of the port and the database config to the utility process for initialization
  dbProcess.postMessage(
    {
      dbConfig: defaultConfig,
      dbPath: process.env['INSOMNIA_DATA_PATH'] || electron.app.getPath('userData'),
    },
    [port2],
  );

  const [promise, resolve, reject] = createPromiseResolvers();

  const listenerMap = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();

  port1.on('message', message => {
    const data: ResultMessage | ErrorMessage | ReadyMessage = message.data;

    console.debug('[debug]', '[main]', `onMessage [${channel}] from db process`, Date.now());

    if (isReadyMessage(data)) {
      resolve(true);
    } else if (isErrorMessage(data)) {
      const { id, error } = data;
      const listener = listenerMap.get(id);
      if (listener) {
        const err = new Error(error);
        listener.reject(err);
        listenerMap.delete(id);
      }
    } else if (isResponseMessage(data)) {
      const { id, result } = data;
      const listener = listenerMap.get(id);
      if (listener) {
        listener.resolve(result);
        listenerMap.delete(id);
      }
    } else {
      console.warn('dbProcess sent unexpected message:', data);
    }
  });

  port1.start();
  await promise;
  // A proxy to forward database calls to the utility process
  bucketsProxy = new Proxy({} as DatabaseBuckets, {
    get(_target, type: string) {
      return new Proxy({} as DatabaseBucket, {
        get(_target, func: string) {
          return (...args: any[]) => {
            const id = uuidv4();
            console.debug('[debug]', '[main]', `postMessage [${channel}] to db process`, id, Date.now());
            port1.postMessage({ id, channel, type, func, args });

            return new Promise((resolve, reject) => {
              listenerMap.set(id, { resolve, reject });
            });
          };
        },
      });
    },
  });

  return bucketsProxy;
};

export const initRenderProcessDatabaseConsumer = async () => {
  ipcMain.on(
    `${channel}`,
    async (
      e,
      replyChannel,
      data: {
        type: keyof typeof bucketsProxy;
        func: DatabaseBucketOperations;
        args: any[];
      },
    ) => {
      const { type, func, args } = data;

      console.debug('[debug]', '[main]', `onMessage [${channel}] from render process`, Date.now());
      const result = await (bucketsProxy[type][func] as any)(...args);

      console.debug('[debug]', '[main]', `postMessage [${channel}] to render process`, Date.now());
      e.sender.send(replyChannel, null, result);
    },
  );
};

export const addUtilityProcessDatabaseConsumer = (consumerProcessesMainPort: MessagePortMain) => {
  consumerProcessesMainPort.on('message', async event => {
    const data = event.data;
    const { channel, id, type, func, args } = data as {
      channel?: string;
      id: string;
      type: keyof typeof bucketsProxy;
      func: DatabaseBucketOperations;
      args: any[];
    };
    if (channel === 'db' && id) {
      console.debug('[debug]', '[main]', `onMessage [${channel}] from utility process`, id, Date.now());
      const result = await (bucketsProxy[type][func] as any)(...args);
      console.debug('[debug]', '[main]', `postMessage [${channel}] to utility process`, id, Date.now());
      consumerProcessesMainPort.postMessage({ type: 'response', id, result, channel });
    }
  });
};
