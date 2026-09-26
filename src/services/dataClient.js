import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import outputs from '../../amplify_outputs.json';

const hasAmplifyConfig =
  !!outputs &&
  typeof outputs === 'object' &&
  Object.keys(outputs).length > 0;

function createNoopSubscription() {
  return {
    subscribe: ({ next } = {}) => {
      if (typeof next === 'function') {
        next({});
      }

      return {
        unsubscribe() {
          // Intentionally no-op: local development without Amplify config should not
          // spam console errors while the app is still rendering auth pages.
        },
      };
    },
  };
}

function createNoopModel() {
  return {
    list: async () => ({ data: [], errors: [] }),
    create: async () => ({ data: null, errors: [] }),
    update: async () => ({ data: null, errors: [] }),
    delete: async () => ({ data: null, errors: [] }),
    onCreate: createNoopSubscription,
    onDelete: createNoopSubscription,
    onUpdate: createNoopSubscription,
  };
}

if (hasAmplifyConfig) {
  Amplify.configure(outputs);
}

export const dataClient = hasAmplifyConfig
  ? generateClient()
  : {
      models: {
        DirectMessage: createNoopModel(),
        UserProfile: createNoopModel(),
        Friendship: createNoopModel(),
        FriendRequest: createNoopModel(),
      },
    };
