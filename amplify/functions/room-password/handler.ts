import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/room-password';
import type { Schema } from '../../data/resource';

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const storedBuffer = Buffer.from(hash, 'hex');
  const suppliedBuffer = scryptSync(
    password,
    salt,
    storedBuffer.length
  );

  return (
    storedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(storedBuffer, suppliedBuffer)
  );
}

export const handler = async (event: any) => {
  const {
    action,
    roomId,
    ownerId,
    password,
  } = event.arguments ?? {};

  if (!action || !roomId || !password) {
    throw new Error('Missing required fields');
  }

  if (action === 'create') {
    if (!ownerId) {
      throw new Error('Owner ID is required');
    }

    const passwordHash = hashPassword(password);

    const { data, errors } =
      await client.models.RoomSecret.create({
        roomId,
        ownerId,
        passwordHash,
      });

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    return {
      success: true,
      valid: true,
    };
  }

  if (action === 'verify') {
    const { data, errors } =
      await client.models.RoomSecret.list({
        filter: {
          roomId: {
            eq: roomId,
          },
        },
      });

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    const secret = data[0];

    if (!secret) {
      return {
        success: false,
        valid: false,
      };
    }

    return {
      success: true,
      valid: verifyPassword(password, secret.passwordHash),
    };
  }

  throw new Error('Invalid action');
};