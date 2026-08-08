import { defineFunction } from '@aws-amplify/backend';

export const roomPassword = defineFunction({
  name: 'room-password',
  entry: './handler.ts',
});
