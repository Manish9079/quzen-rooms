import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { roomPassword } from '../functions/room-password/resource';

const schema = a
  .schema({
  UserProfile: a
    .model({
      ownerId: a.string().required(),
      username: a.string().required(),
      displayName: a.string().required(),
      email: a.email().required(),
      bio: a.string(),
      avatarUrl: a.string(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('ownerId'),
    ]),

  Room: a
    .model({
      ownerId: a.string().required(),
      hostDisplayName: a.string().required(),
      code: a.string().required(),
      name: a.string().required(),
      description: a.string(),
      category: a.string(),
      isPrivate: a.boolean().default(false),
      isLocked: a.boolean().default(false),
      maxParticipants: a.integer().default(8),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.ownerDefinedIn('ownerId').to(['create', 'update', 'delete']),
    ]),
    RoomSecret: a
  .model({
    roomId: a.string().required(),
    ownerId: a.string().required(),
    passwordHash: a.string().required(),
  })
  .authorization((allow) => [
    allow.ownerDefinedIn('ownerId'),
  ]),
   RoomMember: a
  .model({
    roomId: a.string().required(),
    userId: a.string().required(),
    displayName: a.string().required(),
    role: a.string().default('MEMBER'),
  })
  .authorization((allow) => [
    allow.authenticated().to(['create', 'read', 'update', 'delete']),
  ]),
  WaitingRequest: a
  .model({
    roomId: a.string().required(),
    userId: a.string().required(),
    displayName: a.string().required(),
    status: a.string().default('PENDING'),
  })
  .authorization((allow) => [
    allow.authenticated().to(['create', 'read', 'update', 'delete']),
  ]),
  Message: a
  .model({
    roomId: a.string().required(),
    userId: a.string().required(),
    displayName: a.string().required(),
    body: a.string().required(),
  })
  .authorization((allow) => [
    allow.authenticated().to(['create', 'read', 'delete']),
  ]),
  createRoomPassword: a
  .mutation()
  .arguments({
    action: a.string().required(),
    roomId: a.string().required(),
    ownerId: a.string().required(),
    password: a.string().required(),
  })
  .returns(
    a.customType({
      success: a.boolean(),
      valid: a.boolean(),
    })
  )
  .handler(a.handler.function(roomPassword))
  .authorization((allow) => [
    allow.authenticated(),
  ]),

verifyRoomPassword: a
  .mutation()
  .arguments({
    action: a.string().required(),
    roomId: a.string().required(),
    password: a.string().required(),
  })
  .returns(
    a.customType({
      success: a.boolean(),
      valid: a.boolean(),
    })
  )
  .handler(a.handler.function(roomPassword))
  .authorization((allow) => [
    allow.authenticated(),
  ]),
  })
  .authorization((allow) => [
    allow.resource(roomPassword),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});