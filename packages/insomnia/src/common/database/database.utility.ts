import type { MessagePortMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';

import { channel } from '~/common/database/constant';
import type { DatabaseBuckets } from '~/common/database/database-buckets';
import type { DatabaseBucket } from '~/common/database/interface';

// For utility process - uses MessagePort communication
export const initDatabaseBuckets = async (dbPort: MessagePortMain) => {
  const listenerMap = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();

  dbPort.on('message', messageEvent => {
    const message = messageEvent.data;
    const { channel, id, type, result, error } = message as {
      id: string;
      channel?: string;
      type: 'response' | 'error';
      result?: any;
      error?: string;
    };

    console.debug('[debug]', '[utility]', `dbPort onMessage [${channel}] ${type} from main process`, id, Date.now());

    const listener = listenerMap.get(id);
    if (listener) {
      if (type === 'response') {
        listener.resolve(result);
      } else if (type === 'error') {
        listener.reject(new Error(error));
      } else {
        listener.reject(new Error(`Unknown message type: ${type}`));
      }
      listenerMap.delete(id);
    }
  });

  dbPort.start();

  const _send = async <R>(type: string, fnName: string, ...args: any[]): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      const id = uuidv4();

      console.debug('[debug]', '[utility]', `dbPort postMessage [${channel}]`, id, Date.now());
      dbPort.postMessage({
        id,
        channel,
        type,
        func: fnName,
        args,
      });

      listenerMap.set(id, { resolve, reject });
    });
  };

  return new Proxy({} as DatabaseBuckets, {
    get(_target, type: string) {
      return new Proxy({} as DatabaseBucket, {
        get(_target, func: string) {
          return (...args: any[]) => {
            return _send<any>(type, func, ...args);
          };
        },
      });
    },
  });
};
