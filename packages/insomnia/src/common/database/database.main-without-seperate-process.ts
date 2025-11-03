import electron, { ipcMain } from 'electron';

import {
  createDbBuckets,
  type DatabaseBucketOperations,
  type DatabaseBuckets,
} from '~/common/database/database-buckets';
import type { DatabaseBucketsFactory, DataBaseOptions } from '~/common/database/interface';

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

export const initDatabaseBuckets: DatabaseBucketsFactory = async (
  config: DataBaseOptions = {},
  // consumerProcessesMainPorts: MessagePortMain[] = [],
) => {
  const defaultConfig: DataBaseOptions = {
    autoload: true,
    corruptAlertThreshold: 0.9,
    ...config,
  };

  const bucketsProxy: DatabaseBuckets = createDbBuckets(
    process.env['INSOMNIA_DATA_PATH'] || electron.app.getPath('userData'),
    defaultConfig,
  );

  ipcMain.on(
    `${channel}`,
    async (
      e,
      replyChannel: string,
      data: {
        type: keyof typeof bucketsProxy;
        func: DatabaseBucketOperations;
        args: any[];
      },
    ) => {
      const { type, func, args } = data;
      const result = await (bucketsProxy[type][func] as any)(...args);
      e.sender.send(replyChannel, null, result);

      // console.debug('Send message to render process', replyChannel, data);
    },
  );

  // consumerProcessesMainPorts.forEach(port => {
  //   port.on('message', async event => {
  //     const data = event.data;
  //     const { channel, id, type, func, args } = data;
  //     if (data.channel === channel && data.id) {
  //       const result = await bucketsProxy[type][func](...args);
  //       port.postMessage({ id, result });
  //     }
  //   });
  // });

  return bucketsProxy;
};

async function _send<T>(fnName: string, ...args: any[]) {
  return new Promise<T>((resolve, reject) => {
    const replyChannel = `db.fn.reply`;
    electron.ipcRenderer.send('db.fn', fnName, replyChannel, ...args);
    electron.ipcRenderer.once(replyChannel, (_e, err, result: T) => (err ? reject(err) : resolve(result)));
  });
}
