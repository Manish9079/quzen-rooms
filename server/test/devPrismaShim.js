/**
 * TEST-ONLY fixture — NOT part of the shipped backend.
 *
 * This sandbox's network policy blocks binaries.prisma.sh, so `npx prisma
 * generate` cannot run here (it needs that host to fetch its query engine).
 * On a real machine with normal internet access, `npm install && npx prisma
 * generate` produces the real @prisma/client used by src/config/prisma.js —
 * nothing about the shipped code changes.
 *
 * To still prove the actual business logic (services/controllers/socket
 * handlers, unmodified) against a real, running PostgreSQL database, this
 * file hand-implements just the ~20 Prisma Client calls the codebase makes
 * (grepped from src/), using the `pg` driver directly against the same
 * schema already applied via prisma/migrations. It is swapped in only for
 * this test run (see run-server.mjs) and is intentionally excluded from
 * the delivered project.
 */
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function pgError(err) {
  if (err.code === '23505') {
    const match = /Key \((\w+)\)=/.exec(err.detail || '');
    const wrapped = new Error('Unique constraint violation');
    wrapped.code = 'P2002';
    wrapped.meta = { target: [match?.[1] || 'field'] };
    throw wrapped;
  }
  throw err;
}

async function q(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    return pgError(err);
  }
}

const USER_COLS = ['id', 'username', 'displayName', 'email', 'passwordHash', 'avatar', 'bio', 'onlineStatus', 'createdAt', 'updatedAt'];
const ROOM_COLS = ['id', 'code', 'name', 'description', 'category', 'isPrivate', 'passwordHash', 'maxParticipants', 'chatEnabled', 'videoEnabled', 'screenShareEnabled', 'isLocked', 'createdAt', 'updatedAt', 'closedAt', 'hostId'];
const PARTICIPANT_COLS = ['id', 'role', 'joinedAt', 'leftAt', 'roomId', 'userId'];
const MESSAGE_COLS = ['id', 'body', 'createdAt', 'deletedAt', 'roomId', 'userId'];
const REFRESH_COLS = ['id', 'tokenHash', 'expiresAt', 'createdAt', 'revokedAt', 'replacedByToken', 'userAgent', 'userId'];

const uuid = () => crypto.randomUUID();
const now = () => new Date();
const quote = (c) => `"${c}"`;

function pick(row, select) {
  if (!row) return row;
  if (!select) return row;
  const out = {};
  for (const key of Object.keys(select)) {
    if (select[key] === true) out[key] = row[key];
  }
  return out;
}

async function attachUser(row, alias = 'userId', select) {
  if (!row) return row;
  const r = await q(`SELECT * FROM users WHERE id = $1`, [row[alias]]);
  return { ...row, user: pick(r.rows[0], select) };
}

async function attachHost(row, select) {
  const r = await q(`SELECT * FROM users WHERE id = $1`, [row.hostId]);
  return { ...row, host: pick(r.rows[0], select) };
}

async function attachParticipantCount(row) {
  const r = await q(`SELECT COUNT(*)::int AS c FROM room_participants WHERE "roomId" = $1 AND "leftAt" IS NULL`, [row.id]);
  return { ...row, _count: { participants: r.rows[0].c } };
}

function buildWhere(where, startIndex = 1) {
  const clauses = [];
  const params = [];
  let i = startIndex;

  function walk(cond) {
    if (cond.OR) {
      const parts = cond.OR.map((c) => `(${walkAndReturn(c)})`);
      return parts.join(' OR ');
    }
    const parts = [];
    for (const [key, val] of Object.entries(cond)) {
      if (key === 'OR') continue;
      if (val === null) { parts.push(`${quote(key)} IS NULL`); continue; }
      if (val && typeof val === 'object' && 'not' in val) {
        if (val.not === null) { parts.push(`${quote(key)} IS NOT NULL`); continue; }
        params.push(val.not); parts.push(`${quote(key)} != $${i++}`); continue;
      }
      if (val && typeof val === 'object' && 'lt' in val) {
        params.push(val.lt); parts.push(`${quote(key)} < $${i++}`); continue;
      }
      if (val && typeof val === 'object' && 'contains' in val) {
        params.push(`%${val.contains}%`); parts.push(`${quote(key)} ILIKE $${i++}`); continue;
      }
      params.push(val); parts.push(`${quote(key)} = $${i++}`);
    }
    return parts.join(' AND ');
  }
  function walkAndReturn(cond) {
    const before = params.length;
    const text = walk(cond);
    return text;
  }

  const text = walk(where || {});
  return { text: text || '1=1', params };
}

function model(table, cols) {
  return {
    async create({ data, select }) {
      const id = data.id || uuid();
      const cols2 = [...cols];
      const row = { id, createdAt: now(), updatedAt: now(), ...data };
      const names = cols2.filter((c) => c in row);
      const values = names.map((c) => row[c]);
      const placeholders = names.map((_, idx) => `$${idx + 1}`);
      const sql = `INSERT INTO ${table} (${names.map(quote).join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
      const r = await q(sql, values);
      return pick(r.rows[0], select) ?? r.rows[0];
    },
    async findUnique({ where, select, include }) {
      const { text, params } = buildWhere(where);
      const r = await q(`SELECT * FROM ${table} WHERE ${text} LIMIT 1`, params);
      let row = r.rows[0] || null;
      if (row && include) row = await applyIncludes(table, row, include);
      return select && row ? pick(row, select) : row;
    },
    async findFirst({ where, select, include, orderBy }) {
      const { text, params } = buildWhere(where);
      const order = orderBy ? buildOrderBy(orderBy) : '';
      const r = await q(`SELECT * FROM ${table} WHERE ${text} ${order} LIMIT 1`, params);
      let row = r.rows[0] || null;
      if (row && include) row = await applyIncludes(table, row, include);
      return select && row ? pick(row, select) : row;
    },
    async findMany({ where, select, include, orderBy, skip, take } = {}) {
      const { text, params } = buildWhere(where);
      const order = orderBy ? buildOrderBy(orderBy) : '';
      const limit = take ? ` LIMIT ${Number(take)}` : '';
      const offset = skip ? ` OFFSET ${Number(skip)}` : '';
      const r = await q(`SELECT * FROM ${table} WHERE ${text} ${order}${limit}${offset}`, params);
      let rows = r.rows;
      if (include) rows = await Promise.all(rows.map((row) => applyIncludes(table, row, include)));
      return select ? rows.map((row) => pick(row, select)) : rows;
    },
    async count({ where } = {}) {
      const { text, params } = buildWhere(where);
      const r = await q(`SELECT COUNT(*)::int AS c FROM ${table} WHERE ${text}`, params);
      return r.rows[0].c;
    },
    async update({ where, data, select, include }) {
      const { text, params } = buildWhere(where);
      const patch = { ...data };
      if (cols.includes('updatedAt')) patch.updatedAt = now();
      const setNames = Object.keys(patch);
      const setSql = setNames.map((c, idx) => `${quote(c)} = $${params.length + idx + 1}`).join(', ');
      const values = setNames.map((c) => patch[c]);
      const r = await q(`UPDATE ${table} SET ${setSql} WHERE ${text} RETURNING *`, [...params, ...values]);
      let row = r.rows[0];
      if (row && include) row = await applyIncludes(table, row, include);
      return select && row ? pick(row, select) : row;
    },
    async updateMany({ where, data }) {
      const { text, params } = buildWhere(where);
      const patch = { ...data };
      const setNames = Object.keys(patch);
      const setSql = setNames.map((c, idx) => `${quote(c)} = $${params.length + idx + 1}`).join(', ');
      const values = setNames.map((c) => patch[c]);
      const r = await q(`UPDATE ${table} SET ${setSql} WHERE ${text}`, [...params, ...values]);
      return { count: r.rowCount };
    },
    async delete({ where }) {
      const { text, params } = buildWhere(where);
      const r = await q(`DELETE FROM ${table} WHERE ${text} RETURNING *`, params);
      return r.rows[0];
    },
  };
}

function buildOrderBy(orderBy) {
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts = list.map((o) => {
    const [key, dir] = Object.entries(o)[0];
    return `${quote(key)} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
  });
  return `ORDER BY ${parts.join(', ')}`;
}

async function applyIncludes(table, row, include) {
  let out = row;
  if (include.host) out = await attachHost(out, include.host.select);
  if (include.user) out = await attachUser(out, 'userId', include.user.select);
  if (include._count) out = await attachParticipantCount(out);
  if (include.participants) {
    const where = include.participants.where || { roomId: row.id };
    const { text, params } = buildWhere({ ...where, roomId: row.id });
    const r = await q(`SELECT * FROM room_participants WHERE ${text} ORDER BY "joinedAt" ASC`, params);
    let rows = r.rows;
    if (include.participants.include?.user) {
      rows = await Promise.all(rows.map((p) => attachUser(p, 'userId', include.participants.include.user.select)));
    }
    out = { ...out, participants: rows };
  }
  return out;
}

export const prisma = {
  user: model('users', USER_COLS),
  room: model('rooms', ROOM_COLS),
  roomParticipant: {
    ...model('room_participants', PARTICIPANT_COLS),
    async findUnique({ where, include, select }) {
      if (where.roomId_userId) {
        const { roomId, userId } = where.roomId_userId;
        const r = await q(`SELECT * FROM room_participants WHERE "roomId"=$1 AND "userId"=$2 LIMIT 1`, [roomId, userId]);
        let row = r.rows[0] || null;
        if (row && include) row = await applyIncludes('room_participants', row, include);
        return select && row ? pick(row, select) : row;
      }
      return model('room_participants', PARTICIPANT_COLS).findUnique({ where, include, select });
    },
  },
  message: model('messages', MESSAGE_COLS),
  refreshToken: model('refresh_tokens', REFRESH_COLS),
  async $transaction(ops) {
    return Promise.all(ops);
  },
  async $queryRaw() {
    await pool.query('SELECT 1');
    return [{ '?column?': 1 }];
  },
  async $disconnect() {
    await pool.end();
  },
};
