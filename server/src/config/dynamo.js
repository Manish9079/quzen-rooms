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

const useMemoryFallback = !env.isProd && !process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_SECRET_ACCESS_KEY && !process.env.DYNAMO_ENDPOINT;

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
  if (!where || typeof where !== 'object') return true;
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

function createMemoryModel(_tableName) {
  const rows = new Map();

  return {
    async create({ data, select, include } = {}) {
      const row = { id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), ...decode(data) };
      rows.set(row.id, row);
      return pick(await related(row, include), select);
    },
    async findUnique({ where, select, include } = {}) {
      const id = where?.id;
      let row = null;
      if (id) row = rows.get(id) || null;
      else row = [...rows.values()].find((candidate) => matches(candidate, where)) || null;
      return row ? pick(await related(row, include), select) : null;
    },
    async findFirst({ where, select, include, orderBy } = {}) {
      const row = sortRows([...rows.values()].filter((candidate) => matches(candidate, where)), orderBy)[0];
      return row ? pick(await related(row, include), select) : null;
    },
    async findMany({ where, select, include, orderBy, skip = 0, take } = {}) {
      let items = sortRows([...rows.values()].filter((row) => matches(row, where)), orderBy).slice(skip, take ? skip + Number(take) : undefined);
      items = await Promise.all(items.map((row) => related(row, include)));
      return select ? items.map((row) => pick(row, select)) : items;
    },
    async count({ where } = {}) {
      return [...rows.values()].filter((row) => matches(row, where)).length;
    },
    async update({ where, data, select, include } = {}) {
      const current = await this.findUnique({ where });
      if (!current) return null;
      const next = { ...rows.get(current.id), ...decode(data), updatedAt: new Date() };
      rows.set(current.id, next);
      return pick(await related(next, include), select);
    },
    async updateMany({ where, data } = {}) {
      const matchesRows = [...rows.values()].filter((row) => matches(row, where));
      for (const row of matchesRows) {
        rows.set(row.id, { ...row, ...decode(data), updatedAt: new Date() });
      }
      return { count: matchesRows.length };
    },
    async delete({ where } = {}) {
      const row = await this.findUnique({ where });
      if (!row) return null;
      rows.delete(row.id);
      return row;
    },
  };
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

function createAwsModel(kind, tableName, documentClient) {
  return {
    async create({ data, select, include } = {}) {
      const now = new Date();
      const row = { id: randomUUID(), createdAt: now, updatedAt: now, ...data };
      await documentClient.send(new PutCommand({ TableName: tableName, Item: encode(row), ConditionExpression: 'attribute_not_exists(id)' }));
      return pick(await related(row, include), select);
    },
    async findUnique({ where, select, include } = {}) {
      const id = where?.id;
      let row;
      if (id) {
        const result = await documentClient.send(new GetCommand({ TableName: tableName, Key: { id } }));
        row = result.Item ? decode(result.Item) : null;
      } else row = (await allRows(documentClient, tableName)).find((candidate) => matches(candidate, where));
      return row ? pick(await related(row, include), select) : null;
    },
    async findFirst({ where, select, include, orderBy } = {}) {
      const rows = sortRows((await allRows(documentClient, tableName)).filter((row) => matches(row, where)), orderBy);
      return rows[0] ? pick(await related(rows[0], include), select) : null;
    },
    async findMany({ where, select, include, orderBy, skip = 0, take } = {}) {
      let rows = sortRows((await allRows(documentClient, tableName)).filter((row) => matches(row, where)), orderBy).slice(skip, take ? skip + Number(take) : undefined);
      rows = await Promise.all(rows.map((row) => related(row, include)));
      return select ? rows.map((row) => pick(row, select)) : rows;
    },
    async count({ where } = {}) { return (await allRows(documentClient, tableName)).filter((row) => matches(row, where)).length; },
    async update({ where, data, select, include } = {}) {
      const current = await this.findUnique({ where });
      if (!current) return null;
      const patch = { ...data, updatedAt: new Date() };
      const names = Object.keys(patch);
      const values = Object.fromEntries(names.map((key, index) => [`:value${index}`, encode(patch[key])]));
      const result = await documentClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { id: current.id },
        UpdateExpression: `SET ${names.map((key, index) => `#field${index} = :value${index}`).join(', ')}`,
        ExpressionAttributeNames: Object.fromEntries(names.map((key, index) => [`#field${index}`, key])),
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }));
      return pick(await related(decode(result.Attributes), include), select);
    },
    async updateMany({ where, data } = {}) {
      const rows = (await allRows(documentClient, tableName)).filter((row) => matches(row, where));
      await Promise.all(rows.map((row) => this.update({ where: { id: row.id }, data })));
      return { count: rows.length };
    },
    async delete({ where } = {}) {
      const row = await this.findUnique({ where });
      if (!row) return null;
      await documentClient.send(new DeleteCommand({ TableName: tableName, Key: { id: row.id } }));
      return row;
    },
  };
}

async function allRows(documentClient, tableName) {
  const rows = [];
  let ExclusiveStartKey;
  do {
    const result = await documentClient.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }));
    rows.push(...(result.Items || []).map(decode));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return rows;
}

const tableNames = {
  user: env.dynamoTables.users,
  room: env.dynamoTables.rooms,
  roomParticipant: env.dynamoTables.participants,
  message: env.dynamoTables.messages,
  refreshToken: env.dynamoTables.refreshTokens,
};

const memoryModels = {
  user: createMemoryModel('user'),
  room: createMemoryModel('room'),
  roomParticipant: createMemoryModel('roomParticipant'),
  message: createMemoryModel('message'),
  refreshToken: createMemoryModel('refreshToken'),
};

const awsClient = useMemoryFallback ? null : new DynamoDBClient({ region: env.awsRegion, endpoint: env.dynamoEndpoint });
const documentClient = awsClient ? DynamoDBDocumentClient.from(awsClient, { marshallOptions: { removeUndefinedValues: true } }) : null;

const awsModels = awsClient ? {
  user: createAwsModel('user', tableNames.user, documentClient),
  room: createAwsModel('room', tableNames.room, documentClient),
  roomParticipant: createAwsModel('roomParticipant', tableNames.roomParticipant, documentClient),
  message: createAwsModel('message', tableNames.message, documentClient),
  refreshToken: createAwsModel('refreshToken', tableNames.refreshToken, documentClient),
} : memoryModels;

const models = awsModels;

export const db = {
  ...models,
  async $transaction(operations) { return Promise.all(operations); },
  async $queryRaw() {
    if (!documentClient) return [{ database: 'memory' }];
    await documentClient.send(new DescribeTableCommand({ TableName: tableNames.user }));
    return [{ database: 'ok' }];
  },
  async $disconnect() {},
};