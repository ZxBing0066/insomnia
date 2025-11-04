import { configureInitDbBuckets, database } from '~/common/database';
import { initDatabaseBuckets } from '~/common/database/database.utility';
import * as models from '~/models';

export const readyMessage = {
  type: 'ready',
} as const;

export interface ErrorMessage {
  type: 'error';
  error: string;
}

export interface DatabaseResponse {
  type: 'response';
  id: string;
  result: any;
}

// Database operations using models
const databaseOperations = {
  async listProjects() {
    return await models.project.all();
  },

  async listWorkspaces() {
    return await models.workspace.all();
  },
};

process.parentPort.once('message', async message => {
  const [port, dbPort] = message.ports;

  // Configure database client with current utility process factory
  configureInitDbBuckets(() => initDatabaseBuckets(dbPort));
  await database.init();

  console.debug('[debug]', '[utility]', 'Database initialized', Date.now());

  port.on('message', async messageEvent => {
    try {
      const message = messageEvent.data;
      const { id, func } = message as {
        id: string;
        func: keyof typeof databaseOperations;
      };

      console.debug('[debug]', '[utility]', `onMessage ${func}`, Date.now());
      const result = await (databaseOperations[func] as any)();
      port.postMessage({
        type: 'response',
        id,
        result,
      } as DatabaseResponse);
    } catch (error) {
      const message = messageEvent.data;
      port.postMessage({
        id: message.id,
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  port.start();
  port.postMessage(readyMessage);
});
