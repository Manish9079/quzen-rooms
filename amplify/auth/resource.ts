import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    phone: false,
    username: false,
  },
  userAttributes: {
    preferredUsername: {
      mutable: false,
      required: true,
    },
    name: {
      mutable: true,
      required: true,
    },
  },
  passwordPolicy: {
    minimumLength: 8,
    requireNumbers: true,
    requireUppercase: false,
    requireLowercase: true,
    requireSpecialCharacters: false,
  },
});
