import path from 'node:path';

import { ipcMain, MessageChannelMain, type MessagePortMain, utilityProcess } from 'electron';
import { v4 as uuidv4 } from 'uuid';

// import { addUtilityProcessDatabaseConsumer } from '~/common/database/database.main';

let demoProcess: Electron.UtilityProcess;
let processPort: MessagePortMain;

export const initDemo = (dbPort: MessagePortMain) => {
  const { port1, port2 } = new MessageChannelMain();
  processPort = port1;
  demoProcess = utilityProcess.fork(path.join(__dirname, 'entry.demo-utility-process.min.js'), [], {
    serviceName: 'demo-utility-process',
    env: process.env,
    execArgv: process.env.NODE_ENV === 'development' ? ['--inspect=5862'] : [],
  });
  demoProcess.on('exit', code => {
    console.log('Demo utility process exited with code:', code);
  });

  demoProcess.postMessage({}, [port2, dbPort]);
  // addUtilityProcessDatabaseConsumer(dbPort1);
  port1.start();
  dbPort.start();

  return demoProcess;
};

export const demoAPI = {
  listProjects: async () => {
    return new Promise<any[]>((resolve, reject) => {
      const id = uuidv4();

      console.debug('[debug]', '[main]', 'postMessage listProjects', Date.now());
      processPort.postMessage({ id, func: 'listProjects' });

      const listener = (event: Electron.MessageEvent) => {
        if (event.data.id === id) {
          if (event.data.error) {
            reject(event.data.error);
          } else {
            resolve(event.data.result);
          }
        }
      };
      processPort.on('message', listener);
    });
  },
  listWorkspaces: async () => {
    return new Promise<any[]>((resolve, reject) => {
      const id = uuidv4();

      console.debug('[debug]', '[main]', 'postMessage listWorkspaces', Date.now());
      processPort.postMessage({ id, func: 'listWorkspaces' });

      const listener = (event: Electron.MessageEvent) => {
        if (event.data.id === id) {
          if (event.data.error) {
            reject(event.data.error);
          } else {
            resolve(event.data.result);
          }
        }
      };
      processPort.on('message', listener);
    });
  },
};

ipcMain.handle('demo.utility.listProjects', async () => {
  console.debug('[debug]', '[main]', 'handle demo.utility.listProjects', Date.now());
  return demoAPI.listProjects();
});

ipcMain.handle('demo.utility.listWorkspaces', async () => {
  console.debug('[debug]', '[main]', 'handle demo.utility.listWorkspaces', Date.now());
  return demoAPI.listWorkspaces();
});
