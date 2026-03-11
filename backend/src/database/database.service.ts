import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { createTxClient, type TxClient } from './transaction-client';
import type { UserByIdResult } from '@/common/database/db.types';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly supabase: SupabaseClient;
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Set them in .env',
      );
    }
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is required for transactions. Set it in .env',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey) as SupabaseClient;
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  getSupabase(): SupabaseClient {
    return this.supabase;
  }

  /** Run a function within a database transaction */
  async transaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tx = createTxClient(client);
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Raw SQL query (for complex reads) */
  async query<T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const r = await client.query(sql, values ?? []);
      return r.rows as T[];
    } finally {
      client.release();
    }
  }

  /** JWT validation - find user by id */
  async findUserById(id: string): Promise<UserByIdResult> {
    const { data, error } = await this.supabase
      .from('User')
      .select(
        'id, nickname, role, balance, profileImageUrl, createdAt, updatedAt',
      )
      .eq('id', id)
      .single();

    if (error) {
      this.logger.error(`findUserById failed for id=${id}`, error);
      throw error;
    }
    if (!data) return null;

    return {
      id: data.id as string,
      nickname: data.nickname as string,
      role: data.role as string,
      balance: data.balance as number,
      profileImageUrl: (data.profileImageUrl ?? null) as string | null,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
    };
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
