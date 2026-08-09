import { dataClient } from './dataClient';

export const friendService = {
  async searchUsers(query, currentUserId) {
  const { data, errors } = await dataClient.models.UserProfile.list();

  if (errors?.length) {
    throw new Error(errors[0].message || 'Could not search users');
  }

  const q = query
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

  return data.filter((user) => {
    if (user.ownerId === currentUserId) return false;

    return user.username?.toLowerCase() === q;
  });
},

  async sendFriendRequest(fromUser, toUser) {
  if (!fromUser?.id || !toUser?.ownerId) {
    throw new Error('Invalid user information.');
  }

  if (fromUser.id === toUser.ownerId) {
    throw new Error('You cannot add yourself.');
  }

  // Check if already friends
  const { data: friendships, errors: friendshipErrors } =
    await dataClient.models.Friendship.list();

  if (friendshipErrors?.length) {
    throw new Error(
      friendshipErrors[0].message || 'Could not check friendship'
    );
  }

  const alreadyFriends = friendships.some(
    (friendship) =>
      (friendship.userAId === fromUser.id &&
        friendship.userBId === toUser.ownerId) ||
      (friendship.userBId === fromUser.id &&
        friendship.userAId === toUser.ownerId)
  );

  if (alreadyFriends) {
    throw new Error('This user is already your friend.');
  }

  // Check existing pending request in either direction
  const { data: requests, errors: requestErrors } =
    await dataClient.models.FriendRequest.list();

  if (requestErrors?.length) {
    throw new Error(
      requestErrors[0].message || 'Could not check friend requests'
    );
  }

  const existingRequest = requests.find(
    (request) =>
      request.status === 'PENDING' &&
      (
        (request.fromUserId === fromUser.id &&
          request.toUserId === toUser.ownerId) ||
        (request.fromUserId === toUser.ownerId &&
          request.toUserId === fromUser.id)
      )
  );

  if (existingRequest) {
    if (existingRequest.fromUserId === fromUser.id) {
      throw new Error('Friend request already sent.');
    }

    throw new Error('This user has already sent you a friend request.');
  }

  const { data, errors } =
    await dataClient.models.FriendRequest.create({
      fromUserId: fromUser.id,
      fromDisplayName: fromUser.displayName,
      toUserId: toUser.ownerId,
      toDisplayName: toUser.displayName,
      status: 'PENDING',
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not send friend request'
    );
  }

  return data;
},

  async getIncomingRequests(userId) {
    const { data, errors } =
      await dataClient.models.FriendRequest.list({
        filter: {
          toUserId: {
            eq: userId,
          },
        },
      });

    if (errors?.length) {
      throw new Error(
        errors[0].message || 'Could not load friend requests'
      );
    }

    return data.filter((request) => request.status === 'PENDING');
  },

  async acceptFriendRequest(request) {
    const { errors: friendshipErrors } =
      await dataClient.models.Friendship.create({
        userAId: request.fromUserId,
        userADisplayName: request.fromDisplayName,
        userBId: request.toUserId,
        userBDisplayName: request.toDisplayName,
      });

    if (friendshipErrors?.length) {
      throw new Error(
        friendshipErrors[0].message || 'Could not add friend'
      );
    }

    const { errors: requestErrors } =
      await dataClient.models.FriendRequest.update({
        id: request.id,
        status: 'ACCEPTED',
      });

    if (requestErrors?.length) {
      throw new Error(
        requestErrors[0].message || 'Could not update friend request'
      );
    }
  },

  async rejectFriendRequest(requestId) {
    const { errors } =
      await dataClient.models.FriendRequest.update({
        id: requestId,
        status: 'REJECTED',
      });

    if (errors?.length) {
      throw new Error(
        errors[0].message || 'Could not reject friend request'
      );
    }
    
  },
  

  async getFriends(userId) {
    const { data, errors } =
      await dataClient.models.Friendship.list();

    if (errors?.length) {
      throw new Error(
        errors[0].message || 'Could not load friends'
        
      );
    }

    return data
      .filter(
        (friendship) =>
          friendship.userAId === userId ||
          friendship.userBId === userId
      )
      .map((friendship) => {
        if (friendship.userAId === userId) {
          return {
            id: friendship.userBId,
            displayName: friendship.userBDisplayName,
            friendshipId: friendship.id,
          };
        }

        return {
          id: friendship.userAId,
          displayName: friendship.userADisplayName,
          friendshipId: friendship.id,
        };
      });
  },
  async removeFriend(friendshipId) {
  if (!friendshipId) {
    throw new Error('Friendship ID is missing.');
  }

  const { data, errors } =
    await dataClient.models.Friendship.delete({
      id: friendshipId,
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not remove friend'
    );
  }

  return data;
},
};