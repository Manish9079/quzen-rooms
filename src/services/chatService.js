import { dataClient } from './dataClient';

export const chatService = {
  async getHistory(roomId) {
    const { data, errors } = await dataClient.models.Message.list({
      filter: {
        roomId: {
          eq: roomId,
        },
      },
    });

    if (errors?.length) {
      throw new Error(errors[0].message || 'Could not load messages');
    }

    return {
      messages: [...data].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      ),
    };
  },

  async send(roomId, user, body) {
    const { data, errors } = await dataClient.models.Message.create({
      roomId,
      userId: user.id,
      displayName: user.displayName,
      body,
    });

    if (errors?.length) {
      throw new Error(errors[0].message || 'Could not send message');
    }

    return {
      ok: true,
      message: data,
    };
  },

  subscribeToMessages(roomId, handler) {
    const subscription = dataClient.models.Message.onCreate().subscribe({
      next: (message) => {
        if (message.roomId === roomId) {
          handler(message);
        }
      },
      error: (err) => {
        console.error('Message subscription error:', err);
      },
    });

    return () => subscription.unsubscribe();
  },
};