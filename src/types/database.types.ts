/**
 * Database Types
 * Types and interfaces for database operations and ORM
 */

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    idle: number;
  };
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  include?: string[];
  select?: string[];
  where?: Record<string, any>;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number;
}

export interface Migration {
  id: string;
  name: string;
  timestamp: Date;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export interface DatabaseSchema {
  tables: TableSchema[];
  indexes: IndexSchema[];
  constraints: ConstraintSchema[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primaryKey: string[];
  foreignKeys: ForeignKeySchema[];
}

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  nullable: boolean;
  defaultValue?: any;
  unique?: boolean;
  autoIncrement?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
}

export type ColumnType = 
  | 'varchar'
  | 'text'
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'float'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'json'
  | 'uuid'
  | 'enum';

export interface IndexSchema {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ConstraintSchema {
  name: string;
  table: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
}

export interface ForeignKeySchema {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
}

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findOne(where: Record<string, any>): Promise<T | null>;
  findMany(options?: QueryOptions): Promise<QueryResult<T>>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(where?: Record<string, any>): Promise<number>;
  exists(where: Record<string, any>): Promise<boolean>;
}

export interface UnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
  getRepository<T>(entity: string): Repository<T>;
}

export interface DatabaseMetrics {
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  queries: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
  };
  transactions: {
    active: number;
    committed: number;
    rolledBack: number;
  };
  performance: {
    slowQueries: number;
    deadlocks: number;
    lockWaits: number;
  };
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
  invalidateOn?: string[];
}

export interface CacheResult<T> {
  data: T;
  cached: boolean;
  cacheKey: string;
  expiresAt?: Date;
}

export interface SeedData {
  table: string;
  data: Record<string, any>[];
  truncate?: boolean;
  updateOnConflict?: boolean;
}