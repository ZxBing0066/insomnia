import fsPath from 'node:path';

import NeDB from '@seald-io/nedb';

import type { DataBaseOptions } from '~/common/database/interface';
import type { ApiSpec } from '~/models/api-spec';
import type { CaCertificate } from '~/models/ca-certificate';
import type { ClientCertificate } from '~/models/client-certificate';
import type { CloudProviderCredential } from '~/models/cloud-credential';
import type { CookieJar } from '~/models/cookie-jar';
import type { Environment } from '~/models/environment';
import type { GitRepository } from '~/models/git-repository';
import type { Workspace } from '~/models/workspace';
import type { WorkspaceMeta } from '~/models/workspace-meta';

interface SpecificQuery {
  $gt?: number;
  $in?: (string | null)[];
  $nin?: string[];
  $ne?: string | null;
}

type Sort = Record<string, any>;

const defaultSort = { created: 1 };

type Query<T> = {
  [key in keyof T]?: string | SpecificQuery | null | undefined;
};

export const createDatabaseBucket = <T = Record<string, any>>(config: NeDB.DataStoreOptions) => {
  const defaultConfig = {
    autoload: true,
    corruptAlertThreshold: 0.9,
    ...config,
  };

  const db = new NeDB<T>(defaultConfig);

  return {
    count: <O = T>(query?: Query<O>) => {
      return (db as NeDB<O>).countAsync(query);
    },
    insert: <O = T>(doc: O) => {
      return (db as NeDB<O>).insertAsync(doc);
    },
    find: <O = T>(query: Query<O> | string = {}, sort: Sort = defaultSort, limit = 0) => {
      return (db as NeDB<O>).findAsync(query).sort(sort).limit(limit);
    },
    findOne: <O = T>(query: Query<O> | string = {}, sort: Sort = defaultSort) => {
      return (db as NeDB<O>).findOneAsync(query).sort(sort);
    },
    update: <O = T>(id: string, patch: Partial<O>, options?: Nedb.UpdateOptions) => {
      return (db as NeDB<O>).updateAsync({ _id: id }, patch, options);
    },
    remove: <O = T>(id: string | SpecificQuery, options: NeDB.RemoveOptions = {}) => {
      return (db as NeDB<O>).removeAsync({ _id: id }, options);
    },
  };
};

export const createDbBuckets = (dbPath: string, defaultConfig: DataBaseOptions) => {
  const dbFactory = <T>(type: string, _config: DataBaseOptions = {}): DatabaseBucket<T> => {
    const db = createDatabaseBucket<T>({
      ..._config,
      filename: fsPath.join(dbPath, `insomnia.${type}.db`),
    });

    return db;
  };

  const buckets = {
    ApiSpec: dbFactory<ApiSpec>('ApiSpec', defaultConfig),
    CaCertificate: dbFactory<CaCertificate>('CaCertificate', defaultConfig),
    ClientCertificate: dbFactory<ClientCertificate>('ClientCertificate', defaultConfig),
    CloudCredential: dbFactory<CloudProviderCredential>('CloudCredential', defaultConfig),
    CookieJar: dbFactory<CookieJar>('CookieJar', defaultConfig),
    Environment: dbFactory<Environment>('Environment', defaultConfig),
    GitCredentials: dbFactory('GitCredentials', defaultConfig),
    GitRepository: dbFactory<GitRepository>('GitRepository', defaultConfig),
    GrpcRequest: dbFactory('GrpcRequest', defaultConfig),
    GrpcRequestMeta: dbFactory('GrpcRequestMeta', defaultConfig),
    MockRoute: dbFactory('MockRoute', defaultConfig),
    MockServer: dbFactory('MockServer', defaultConfig),
    McpRequest: dbFactory('McpRequest', defaultConfig),
    McpResponse: dbFactory('McpResponse', defaultConfig),
    McpPayload: dbFactory('McpPayload', defaultConfig),
    OAuth2Token: dbFactory('OAuth2Token', defaultConfig),
    PluginData: dbFactory('PluginData', defaultConfig),
    Project: dbFactory('Project', defaultConfig),
    ProtoDirectory: dbFactory('ProtoDirectory', defaultConfig),
    ProtoFile: dbFactory('ProtoFile', defaultConfig),
    Request: dbFactory('Request', defaultConfig),
    RequestGroup: dbFactory('RequestGroup', defaultConfig),
    RequestGroupMeta: dbFactory('RequestGroupMeta', defaultConfig),
    RequestMeta: dbFactory('RequestMeta', defaultConfig),
    RequestVersion: dbFactory('RequestVersion', defaultConfig),
    Response: dbFactory('Response', defaultConfig),
    RunnerTestResult: dbFactory('RunnerTestResult', defaultConfig),
    Settings: dbFactory('Settings', defaultConfig),
    SocketIOPayload: dbFactory('SocketIOPayload', defaultConfig),
    SocketIORequest: dbFactory('SocketIORequest', defaultConfig),
    SocketIOResponse: dbFactory('SocketIOResponse', defaultConfig),
    Stats: dbFactory('Stats', defaultConfig),
    UnitTest: dbFactory('UnitTest', defaultConfig),
    UnitTestResult: dbFactory('UnitTestResult', defaultConfig),
    UnitTestSuite: dbFactory('UnitTestSuite', defaultConfig),
    UserSession: dbFactory('UserSession', defaultConfig),
    WebSocketPayload: dbFactory('WebSocketPayload', defaultConfig),
    WebSocketRequest: dbFactory('WebSocketRequest', defaultConfig),
    WebSocketResponse: dbFactory('WebSocketResponse', defaultConfig),
    Workspace: dbFactory<Workspace>('Workspace', defaultConfig),
    WorkspaceMeta: dbFactory<WorkspaceMeta>('WorkspaceMeta', defaultConfig),
  };
  return buckets;
};

export type DatabaseBucket<T = Record<string, any>> = ReturnType<typeof createDatabaseBucket<T>>;
export type DatabaseBucketOperations = 'count' | 'insert' | 'find' | 'findOne' | 'update' | 'remove';
export type DatabaseBuckets = ReturnType<typeof createDbBuckets>;
