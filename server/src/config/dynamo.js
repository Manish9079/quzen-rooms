import { randomUUID } from 'node:crypto';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { env } from './env.js';

const client = new DynamoDBClient({ region: env.awsRegion, endpoint: env.dynamoEndpoint });
const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const tableNames = {
  user: env.dynamoTables.users,
  room: env.dynamoTables.rooms,
  roomParticipant: env.dynamoTables.participants,
  message: env.dynamoTables.messages,
  refreshToken: env.dynamoTables.refreshTokens,
};

const dateFields = /(?:At|Date)$/;

function encode(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)]));
  return value;
}

function decode(value) {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, dateFields.test(key) && typeof item === 'string' ? new Date(item) : decode(item)]));
  }
  return value;
}

function pick(row, select) {
  if (!row || !select) return row;
  return Object.fromEntries(Object.entries(select).filter(([, selected]) => selected === true).map(([key]) => [key, row[key]]));
}

function matches(row, where = {}) {
  if (where.OR) return where.OR.some((condition) => matches(row, condition));
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'roomId_userId') return row.roomId === expected.roomId && row.userId === expected.userId;
    if (expected === null) return row[key] == null;
    if (expected && typeof expected === 'object') {
      if ('not' in expected) return row[key] !== expected.not;
      if ('lt' in expected) return row[key] < expected.lt;
      if ('contains' in expected) return String(row[key] || '').toLowerCase().includes(String(expected.contains).toLowerCase());
    }
    return row[key] === expected;
  });
}

function sortRows(rows, orderBy) {
  if (!orderBy) return rows;
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((left, right) => {
    for (const order of orders) {
      const [key, direction] = Object.entries(order)[0];
      if (left[key] === right[key]) continue;
      const result = left[key] > right[key] ? 1 : -1;
      return direction === 'desc' ? -result : result;
    }
    return 0;
  });
}

async function allRows(tableName) {
  const rows = [];
  let ExclusiveStartKey;
  do {
    const result = await documentClient.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }));
    rows.push(...(result.Items || []).map(decode));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return rows;
}

async function related(row, include) {
  if (!include) return row;
  let result = row;
  if (include.host) result = { ...result, host: await models.user.findUnique({ where: { id: row.hostId }, select: include.host.select }) };
  if (include.user) result = { ...result, user: await models.user.findUnique({ where: { id: row.userId }, select: include.user.select }) };
  if (include._count) {
    const participants = await models.roomParticipant.findMany({ where: { roomId: row.id, leftAt: null } });
    result = { ...result, _count: { participants: participants.length } };
  }
  if (include.participants) {
    const participants = await models.roomParticipant.findMany({
      where: { ...(include.participants.where || {}), roomId: row.id },
      include: include.participants.include,
      orderBy: { joinedAt: 'asc' },
    });
    result = { ...result, participants };
  }
  return result;
}

function model(kind) {
  const TableName = tableNames[kind];
  return {
    async create({ data, select, include } = {}) {
      const now = new Date();
      const row = { id: randomUUID(), createdAt: now, updatedAt: now, ...data };
      await documentClient.send(new PutCommand({ TableName, Item: encode(row), ConditionExpression: 'attribute_not_exists(id)' }));
      return pick(await related(row, include), select);
    },
    async findUnique({ where, select, include } = {}) {
      const id = where?.id;
      let row;
      if (id) {
        const result = await documentClient.send(new GetCommand({ TableName, Key: { id } }));
        row = result.Item ? decode(result.Item) : null;
      } else row = (await allRows(TableName)).find((candidate) => matches(candidate, where));
      return row ? pick(await related(row, include), select) : null;
    },
    async findFirst({ where, select, include, orderBy } = {}) {
      const rows = sortRows((await allRows(TableName)).filter((row) => matches(row, where)), orderBy);
      return rows[0] ? pick(await related(rows[0], include), select) : null;
    },
    async findMany({ where, select, include, orderBy, skip = 0, take } = {}) {
      let rows = sortRows((await allRows(TableName)).filter((row) => matches(row, where)), orderBy).slice(skip, take ? skip + Number(take) : undefined);
      rows = await Promise.all(rows.map((row) => related(row, include)));
      return select ? rows.map((row) => pick(row, select)) : rows;
    },
    async count({ where } = {}) { return (await allRows(TableName)).filter((row) => matches(row, where)).length; },
    async update({ where, data, select, include } = {}) {
      const current = await this.findUnique({ where });
      if (!current) return null;
      const patch = { ...data, updatedAt: new Date() };
      const names = Object.keys(patch);
      const values = Object.fromEntries(names.map((key, index) => [`:value${index}`, encode(patch[key])]));
      const result = await documentClient.send(new UpdateCommand({
        TableName,
        Key: { id: current.id },
        UpdateExpression: `SET ${names.map((key, index) => `#field${index} = :value${index}`).join(', ')}`,
        ExpressionAttributeNames: Object.fromEntries(names.map((key, index) => [`#field${index}`, key])),
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }));
      return pick(await related(decode(result.Attributes), include), select);
    },
    async updateMany({ where, data } = {}) {
      const rows = (await allRows(TableName)).filter((row) => matches(row, where));
      await Promise.all(rows.map((row) => this.update({ where: { id: row.id }, data })));
      return { count: rows.length };
    },
    async delete({ where } = {}) {
      const row = await this.findUnique({ where });
      if (!row) return null;
      await documentClient.send(new DeleteCommand({ TableName, Key: { id: row.id } }));
      return row;
    },
  };
}

const models = {
  user: model('user'),
  room: model('room'),
  roomParticipant: model('roomParticipant'),
  message: model('message'),
  refreshToken: model('refreshToken'),
};

export const db = {
  ...models,
  async $transaction(operations) { return Promise.all(operations); },
  async $queryRaw() { await documentClient.send(new DescribeTableCommand({ TableName: tableNames.user })); return [{ database: 'ok' }]; },
  async $disconnect() {},
};