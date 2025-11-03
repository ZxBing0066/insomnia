import { ipcRenderer } from 'electron';
import { useState } from 'react';
import { Button, Heading } from 'react-aria-components';

import * as models from '~/models';

interface LogEntry {
  id: string;
  timestamp: string;
  processType: 'renderer' | 'main' | 'utility';
  operation: 'listProjects' | 'listWorkspaces';
  result: any[];
  duration: number;
  error?: string;
}

const DbDemo = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs(prev => [newEntry, ...prev]);
  };

  const setOperationLoading = (key: string, loading: boolean) => {
    setIsLoading(prev => ({ ...prev, [key]: loading }));
  };

  // Render Process Operations (direct models calls)
  const handleRenderListProjects = async () => {
    const key = 'render-projects';
    setOperationLoading(key, true);
    const startTime = performance.now();

    try {
      const projects = await models.project.all();
      const duration = performance.now() - startTime;

      addLog({
        processType: 'renderer',
        operation: 'listProjects',
        result: projects,
        duration: Math.round(duration),
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog({
        processType: 'renderer',
        operation: 'listProjects',
        result: [],
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setOperationLoading(key, false);
    }
  };

  const handleRenderListWorkspaces = async () => {
    const key = 'render-workspaces';
    setOperationLoading(key, true);
    const startTime = performance.now();

    try {
      const workspaces = await models.workspace.all();
      const duration = performance.now() - startTime;

      addLog({
        processType: 'renderer',
        operation: 'listWorkspaces',
        result: workspaces,
        duration: Math.round(duration),
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog({
        processType: 'renderer',
        operation: 'listWorkspaces',
        result: [],
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setOperationLoading(key, false);
    }
  };

  // Main Process Operations (via IPC)
  const handleMainListProjects = async () => {
    const key = 'main-projects';
    setOperationLoading(key, true);
    const startTime = performance.now();

    try {
      console.debug('[debug]', '[renderer]', 'invoke demo.main.listProjects', Date.now());

      // This will go through the main process IPC mechanism
      const projects = await ipcRenderer.invoke('demo.main.listProjects');
      const duration = performance.now() - startTime;

      addLog({
        processType: 'main',
        operation: 'listProjects',
        result: projects,
        duration: Math.round(duration),
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog({
        processType: 'main',
        operation: 'listProjects',
        result: [],
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Main process method not available',
      });
    } finally {
      setOperationLoading(key, false);
    }
  };

  const handleMainListWorkspaces = async () => {
    const key = 'main-workspaces';
    setOperationLoading(key, true);
    const startTime = performance.now();

    try {
      console.debug('[debug]', '[renderer]', 'invoke demo.main.listWorkspaces', Date.now());
      // This will go through the main process IPC mechanism
      const workspaces = await ipcRenderer.invoke('demo.main.listWorkspaces');
      const duration = performance.now() - startTime;

      addLog({
        processType: 'main',
        operation: 'listWorkspaces',
        result: workspaces,
        duration: Math.round(duration),
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog({
        processType: 'main',
        operation: 'listWorkspaces',
        result: [],
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Main process method not available',
      });
    } finally {
      setOperationLoading(key, false);
    }
  };

  // Utility Process Operations (via MessagePort)
  const handleUtilityListProjects = async () => {
    const key = 'utility-projects';
    // For now, this is a placeholder - we'll need to implement the actual utility process communication
    setOperationLoading(key, true);
    const startTime = performance.now();

    try {
      console.debug('[debug]', '[renderer]', 'invoke demo.utility.listProjects', Date.now());

      const projects = await ipcRenderer.invoke('demo.utility.listProjects');
      const duration = performance.now() - startTime;

      addLog({
        processType: 'utility',
        operation: 'listProjects',
        result: projects,
        duration: Math.round(duration),
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog({
        processType: 'utility',
        operation: 'listProjects',
        result: [],
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setOperationLoading(key, false);
    }
  };

  const handleUtilityListWorkspaces = async () => {
    const key = 'utility-workspaces';
    // For now, this is a placeholder - we'll need to implement the actual utility process communication
    setOperationLoading(key, true);
    const startTime = performance.now();

    try {
      console.debug('[debug]', '[renderer]', 'invoke demo.utility.listWorkspaces', Date.now());

      const workspaces = await ipcRenderer.invoke('demo.utility.listWorkspaces');
      const duration = performance.now() - startTime;

      addLog({
        processType: 'utility',
        operation: 'listWorkspaces',
        result: workspaces,
        duration: Math.round(duration),
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog({
        processType: 'utility',
        operation: 'listWorkspaces',
        result: [],
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setOperationLoading(key, false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="mx-auto h-full w-full max-w-6xl bg-white p-6">
      <Heading className="mb-6 text-2xl font-bold">Database Process Demo</Heading>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Render Process */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <Heading className="mb-4 text-lg font-semibold text-blue-600">Renderer Process</Heading>
          <p className="mb-4 whitespace-break-spaces text-sm text-gray-600">
            {/* {'Renderer -IPC-> Main -MessagePort-> DB Process'} */}
            {/* {'\n'} */}
            {/* {'Renderer <-IPC- Main <-MessagePort- DB Process'} */}
            Direct database calls via models in renderer process
          </p>
          <div className="space-y-2">
            <Button
              className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              onPress={handleRenderListProjects}
              isDisabled={isLoading['render-projects']}
            >
              {isLoading['render-projects'] ? 'Loading...' : 'List Projects'}
            </Button>
            <Button
              className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              onPress={handleRenderListWorkspaces}
              isDisabled={isLoading['render-workspaces']}
            >
              {isLoading['render-workspaces'] ? 'Loading...' : 'List Workspaces'}
            </Button>
          </div>
        </div>

        {/* Main Process */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <Heading className="mb-4 text-lg font-semibold text-green-600">Main Process</Heading>
          <p className="mb-4 text-sm text-gray-600">Database calls via IPC to main process</p>
          <div className="space-y-2">
            <Button
              className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
              onPress={handleMainListProjects}
              isDisabled={isLoading['main-projects']}
            >
              {isLoading['main-projects'] ? 'Loading...' : 'List Projects'}
            </Button>
            <Button
              className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
              onPress={handleMainListWorkspaces}
              isDisabled={isLoading['main-workspaces']}
            >
              {isLoading['main-workspaces'] ? 'Loading...' : 'List Workspaces'}
            </Button>
          </div>
        </div>

        {/* Utility Process */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <Heading className="mb-4 text-lg font-semibold text-purple-600">Utility Process</Heading>
          <p className="mb-4 text-sm text-gray-600">Database calls via MessagePort to utility process</p>
          <div className="space-y-2">
            <Button
              className="w-full rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
              onPress={handleUtilityListProjects}
              isDisabled={isLoading['utility-projects']}
            >
              {isLoading['utility-projects'] ? 'Loading...' : 'List Projects'}
            </Button>
            <Button
              className="w-full rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
              onPress={handleUtilityListWorkspaces}
              isDisabled={isLoading['utility-workspaces']}
            >
              {isLoading['utility-workspaces'] ? 'Loading...' : 'List Workspaces'}
            </Button>
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <Heading className="text-lg font-semibold">Operation Logs</Heading>
          <Button className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600" onPress={clearLogs}>
            Clear Logs
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No operations logged yet. Click any button above to start testing!
            </div>
          ) : (
            <div className="divide-y">
              {logs.map(log => (
                <div key={log.id} className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          log.processType === 'renderer'
                            ? 'bg-blue-100 text-blue-800'
                            : log.processType === 'main'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {log.processType.toUpperCase()}
                      </span>
                      <span className="font-medium">{log.operation}</span>
                      <span className="text-sm text-gray-500">{log.timestamp}</span>
                    </div>
                    <span className="text-sm text-gray-500">{log.duration}ms</span>
                  </div>

                  {log.error ? (
                    <div className="rounded bg-red-50 p-2 text-sm text-red-600">Error: {log.error}</div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Results:</span> {log.result.length} items found
                      {log.result.length > 0 && (
                        <div className="mt-1 border-l-2 border-gray-200 pl-4">
                          {log.result.slice(0, 3).map((item: any) => (
                            <div key={item._id || item.id || Math.random()} className="text-xs text-gray-500">
                              • {item.name || item._id} ({item.type || 'unknown'})
                            </div>
                          ))}
                          {log.result.length > 3 && (
                            <div className="text-xs text-gray-400">... and {log.result.length - 3} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DbDemo;
