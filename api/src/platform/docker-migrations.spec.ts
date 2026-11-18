import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

type History = {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};
const { assertFreshDockerHistory, assertMigrationTls, assertKnownMigrations } =
  createRequire(import.meta.url)('../../scripts/migrate-docker.cjs') as {
    assertFreshDockerHistory: (rows: History[], publicTables: number) => void;
    assertKnownMigrations: (
      rows: { migration_name: string; checksum: string }[],
      sources: Record<string, string>,
    ) => void;
    assertMigrationTls: (
      connection: string,
      cliConnection: string | undefined,
      required: boolean,
    ) => void;
  };
const baseline: History = {
  migration_name: '20261105000000_commerce_v2_baseline',
  finished_at: new Date('2026-11-17T00:00:00Z'),
  rolled_back_at: null,
};

describe('Fresh Docker migration boundary', () => {
  it('refuses a newer database history absent from an older application image', () => {
    expect(() =>
      assertKnownMigrations(
        [{ migration_name: 'future', checksum: 'a'.repeat(64) }],
        {},
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'DATABASE_HISTORY_NOT_IN_IMAGE' }),
    );
  });
  it('checks applied SQL checksums while tolerating LF/CRLF checkout differences', () => {
    const sql = 'SELECT 1;\n';
    const checksum = createHash('sha256').update(sql).digest('hex');
    expect(() =>
      assertKnownMigrations([{ migration_name: 'known', checksum }], {
        known: sql.replaceAll('\n', '\r\n'),
      }),
    ).not.toThrow();
    expect(() =>
      assertKnownMigrations([{ migration_name: 'known', checksum }], {
        known: 'SELECT 2;\n',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'APPLIED_MIGRATION_WAS_MODIFIED' }),
    );
  });
  it('requires both driver TLS dialects to verify the same database and CA', () => {
    const pg =
      'postgresql://migrate:fixture@db/app?sslmode=verify-full&sslrootcert=/run/ca.pem';
    const cli =
      'postgresql://migrate:fixture@db/app?sslmode=require&sslaccept=strict&sslcert=/run/ca.pem';
    expect(() => assertMigrationTls(pg, cli, true)).not.toThrow();
    for (const value of [
      undefined,
      cli.replace('strict', 'accept_invalid_certs'),
      cli.replace('@db/', '@other/'),
      cli.replace('/run/ca.pem', '/run/other.pem'),
    ])
      expect(() => assertMigrationTls(pg, value, true)).toThrow();
  });
  it('accepts an empty database', () => {
    expect(() => assertFreshDockerHistory([], 0)).not.toThrow();
  });
  it('accepts the completed fresh baseline and later migrations', () => {
    expect(() =>
      assertFreshDockerHistory(
        [
          baseline,
          {
            ...baseline,
            migration_name: '20261106010000_storefront_saved_builds',
          },
        ],
        104,
      ),
    ).not.toThrow();
  });
  it('refuses existing tables without a migration history', () => {
    expect(() => assertFreshDockerHistory([], 104)).toThrowError(
      expect.objectContaining({ code: 'EMPTY_DOCKER_DATABASE_REQUIRED' }),
    );
  });
  it('refuses legacy history even when mixed with a valid baseline', () => {
    const legacy = { ...baseline, migration_name: '20261020140612_init' };
    for (const rows of [[legacy], [baseline, legacy]])
      expect(() => assertFreshDockerHistory(rows, 104)).toThrowError(
        expect.objectContaining({ code: 'FRESH_DOCKER_HISTORY_REQUIRED' }),
      );
  });
  it('refuses an unfinished baseline', () => {
    expect(() =>
      assertFreshDockerHistory([{ ...baseline, finished_at: null }], 104),
    ).toThrowError(
      expect.objectContaining({ code: 'FRESH_DOCKER_HISTORY_REQUIRED' }),
    );
  });
  it('refuses a rolled-back baseline', () => {
    expect(() =>
      assertFreshDockerHistory(
        [{ ...baseline, rolled_back_at: new Date() }],
        104,
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'FRESH_DOCKER_HISTORY_REQUIRED' }),
    );
  });
});
