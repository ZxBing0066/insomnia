import electron from 'electron';
import { v4 as uuidv4 } from 'uuid';

import type { DatabaseBuckets } from '~/common/database/database-buckets';
import type { DatabaseBucket } from '~/common/database/interface';

const channel = 'db';
export const initDatabaseBuckets = () => {
  const _send = async <R>(type: string, fnName: string, ...args: any[]): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      const replyChannel = `${channel}.reply:${uuidv4()}`;
      electron.ipcRenderer.send(`${channel}`, replyChannel, {
        type,
        func: fnName,
        args,
      });
      electron.ipcRenderer.once(replyChannel, (_e, err, result: R) => {
        if (err) {
          const error = new Error(err.message);
          if (err.stack) error.stack = err.stack;
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  };

  return new Proxy({} as DatabaseBuckets, {
    get(_target, prop: string) {
      return new Proxy({} as DatabaseBucket, {
        get(_target, func: string) {
          return (...args: any[]) => {
            return _send<any>(prop, func, ...args);
          };
        },
      });
    },
  });
};
