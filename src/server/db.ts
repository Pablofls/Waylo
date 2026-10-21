import { Pool, type PoolClient, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { __wayloPool?: Pool };

function pool(): Pool {
  if (!globalForPg.__wayloPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta DATABASE_URL.");
    globalForPg.__wayloPool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
      options: "-c search_path=waylo,public",
    });
  }
  return globalForPg.__wayloPool;
}

/** Consulta parametrizada ($1, $2...). Nunca concatenes valores en el SQL. */
export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Ejecuta `fn` dentro de una transacción; hace rollback si lanza. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
