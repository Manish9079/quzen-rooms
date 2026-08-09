import { dataClient } from './dataClient';

function makeConversationId(userAId, userBId) {
  return [userAId, userBId].sort().join('__');
}

export const directMessageService = {
  getConversationId(userAId, userBId) {
    return makeConversationId(userAId, userBId);
  },

  async getHistory(userAId, userBId) {
    const conversationId = makeConversationId(userAId, userBId);

    const { data, errors } =
      await dataClient.models.DirectMessage.list({
        filter: {
          conversationId: {
            eq: conversationId,
          },
        },
      });

    if (errors?.length) {
      throw new Error(
        errors[0].message || 'Could not load messages'
      );
    }

    return [...data].sort(
      (a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
    );
  },

  async send(sender, receiverId, body) {
    const text = body.trim();

    if (!text) return null;

    const conversationId = makeConversationId(
      sender.id,
      receiverId
    );

    const { data, errors } =
      await dataClient.models.DirectMessage.create({
        conversationId,

        senderId: sender.id,
        senderDisplayName: sender.displayName,

        receiverId,

        body: text,
        isRead: false,
      });

    if (errors?.length) {
      throw new Error(
        errors[0].message || 'Could not send message'
      );
    }

    return data;
  },

  subscribe(userAId, userBId, handler) {
    const conversationId = makeConversationId(
      userAId,
      userBId
    );

    const subscription =
      dataClient.models.DirectMessage.onCreate().subscribe({
        next: (message) => {
          if (
            message.conversationId === conversationId
          ) {
            handler(message);
          }
        },

        error: (err) => {
          console.error(
            'Direct message subscription error:',
            err
          );
        },
      });

    return () => subscription.unsubscribe();
  },
  async deleteMessage(messageId) {
  const { data, errors } =
    await dataClient.models.DirectMessage.delete({
      id: messageId,
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not delete message'
    );
  }

  return data;
},

subscribeToDeleted(userAId, userBId, handler) {
  const conversationId = makeConversationId(
    userAId,
    userBId
  );

  const subscription =
    dataClient.models.DirectMessage.onDelete().subscribe({
      next: (message) => {
        if (
          message.conversationId === conversationId
        ) {
          handler(message);
        }
      },

      error: (err) => {
        console.error(
          'Direct message delete subscription error:',
          err
        );
      },
    });

  return () => subscription.unsubscribe();
},
async markConversationAsRead(currentUserId, friendId) {
  const conversationId = makeConversationId(
    currentUserId,
    friendId
  );

  const { data, errors } =
    await dataClient.models.DirectMessage.list({
      filter: {
        conversationId: {
          eq: conversationId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not load unread messages'
    );
  }

  const unreadMessages = data.filter(
    (message) =>
      message.receiverId === currentUserId &&
      message.isRead !== true
  );

  await Promise.all(
    unreadMessages.map(async (message) => {
      const { errors: updateErrors } =
        await dataClient.models.DirectMessage.update({
          id: message.id,
          isRead: true,
        });

      if (updateErrors?.length) {
        throw new Error(
          updateErrors[0].message ||
            'Could not mark message as read'
        );
      }
    })
  );

  return unreadMessages.length;
},
subscribeToUpdates(userAId, userBId, handler) {
  const conversationId = makeConversationId(
    userAId,
    userBId
  );

  const subscription =
    dataClient.models.DirectMessage.onUpdate().subscribe({
      next: (message) => {
        if (message.conversationId === conversationId) {
          handler(message);
        }
      },

      error: (err) => {
        console.error(
          'Direct message update subscription error:',
          err
        );
      },
    });

  return () => subscription.unsubscribe();
},
async getUnreadCount(currentUserId, friendId) {
  const conversationId = makeConversationId(
    currentUserId,
    friendId
  );

  const { data, errors } =
    await dataClient.models.DirectMessage.list({
      filter: {
        conversationId: {
          eq: conversationId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not load unread messages'
    );
  }

  return data.filter(
    (message) =>
      message.receiverId === currentUserId &&
      message.isRead !== true
  ).length;
},
subscribeToAllIncoming(currentUserId, handler) {
  const subscription =
    dataClient.models.DirectMessage.onCreate().subscribe({
      next: (message) => {
        if (message.receiverId === currentUserId) {
          handler(message);
        }
      },

      error: (err) => {
        console.error(
          'Incoming message subscription error:',
          err
        );
      },
    });

  return () => subscription.unsubscribe();
},
async getTotalUnreadCount(currentUserId) {
  const { data, errors } =
    await dataClient.models.DirectMessage.list();

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not load unread count'
    );
  }

  return data.filter(
    (message) =>
      message.receiverId === currentUserId &&
      message.isRead !== true
  ).length;
},

subscribeToAllUpdates(currentUserId, handler) {
  const subscription =
    dataClient.models.DirectMessage.onUpdate().subscribe({
      next: (message) => {
        if (message.receiverId === currentUserId) {
          handler(message);
        }
      },

      error: (err) => {
        console.error(
          'Message update subscription error:',
          err
        );
      },
    });

  return () => subscription.unsubscribe();
},
async deleteConversation(currentUserId, friendId) {
  const conversationId = makeConversationId(
    currentUserId,
    friendId
  );

  const { data, errors } =
    await dataClient.models.DirectMessage.list({
      filter: {
        conversationId: {
          eq: conversationId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not load conversation'
    );
  }

  await Promise.all(
    data.map(async (message) => {
      const updatePayload = {
        id: message.id,
      };

      if (message.senderId === currentUserId) {
        updatePayload.deletedForSender = true;
      }

      if (message.receiverId === currentUserId) {
        updatePayload.deletedForReceiver = true;
      }

      const { errors: updateErrors } =
        await dataClient.models.DirectMessage.update(
          updatePayload
        );

      if (updateErrors?.length) {
        throw new Error(
          updateErrors[0].message ||
            'Could not clear conversation'
        );
      }
    })
  );

  return true;
},
};