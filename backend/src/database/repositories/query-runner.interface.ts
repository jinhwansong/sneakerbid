/** DB 쿼리 실행 인터페이스 - Repository에서 사용 */
export interface QueryRunner {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<T[]>;
}
