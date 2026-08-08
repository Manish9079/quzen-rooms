import { dataClient } from './dataClient';
import { generateRoomCode } from '../utils/roomCode';

export const roomService = {
  async createRoom(payload, ownerId) {
    const { data: existingRooms, errors: existingRoomErrors } =
  await dataClient.models.Room.list({
    filter: {
      ownerId: {
        eq: ownerId,
      },
    },
  });

if (existingRoomErrors?.length) {
  throw new Error(
    existingRoomErrors[0].message || 'Could not check your existing rooms'
  );
}

if (existingRooms.length >= 1) {
  throw new Error(
    'Free users can create only one room at a time. Delete your existing room first.'
  );
}
    const code = generateRoomCode();

    const { data, errors } = await dataClient.models.Room.create({
      ownerId,
      hostDisplayName: payload.hostDisplayName,
      code,
      name: payload.name,
      description: payload.description || '',
      category: payload.category,
      isPrivate: payload.isPrivate,
      maxParticipants: payload.maxParticipants,
    });

    if (errors?.length) {
      throw new Error(errors[0].message || 'Could not create room');
    }

    const { errors: memberErrors } =
      await dataClient.models.RoomMember.create({
        roomId: data.id,
        userId: ownerId,
        displayName: payload.hostDisplayName,
        role: 'HOST',
      });

    if (memberErrors?.length) {
      throw new Error(memberErrors[0].message || 'Could not add room host');
    }
    if (payload.isPrivate && payload.password) {
  const { data: secretResult, errors: secretErrors } =
    await dataClient.mutations.createRoomPassword({
      action: 'create',
      roomId: data.id,
      ownerId,
      password: payload.password,
    });

  if (secretErrors?.length || !secretResult?.success) {
    throw new Error(
      secretErrors?.[0]?.message || 'Could not secure private room'
    );
  }
}

    return { room: data };
  },

  async getPublicRooms() {
  const { data, errors } = await dataClient.models.Room.list({
    filter: {
      isPrivate: {
        eq: false,
      },
    },
  });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not load rooms'
    );
  }

  return { rooms: data };
},

async getMyRooms(ownerId) {
  const { data, errors } = await dataClient.models.Room.list({
    filter: {
      ownerId: {
        eq: ownerId,
      },
    },
  });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not load your rooms'
    );
  }

  return { rooms: data };
},

  async getRoom(code) {
    const { data, errors } = await dataClient.models.Room.list({
      filter: {
        code: {
          eq: code,
        },
      },
    });

    if (errors?.length) {
      throw new Error(errors[0].message || 'Could not load room');
    }

    return { room: data[0] || null };
  },

  async getRoomMembers(roomId) {
    const { data, errors } = await dataClient.models.RoomMember.list({
      filter: {
        roomId: {
          eq: roomId,
        },
      },
    });

    if (errors?.length) {
      throw new Error(errors[0].message || 'Could not load room members');
    }

    return { members: data };
  },
  async getWaitingRequests(roomId) {
  const { data, errors } = await dataClient.models.WaitingRequest.list({
    filter: {
      roomId: {
        eq: roomId,
      },
    },
  });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not load waiting requests'
    );
  }

  return { requests: data };
},

async requestToJoin(room, user) {
  const { data: existing, errors: listErrors } =
    await dataClient.models.WaitingRequest.list({
      filter: {
        roomId: { eq: room.id },
        userId: { eq: user.id },
      },
    });

  if (listErrors?.length) {
    throw new Error(
      listErrors[0].message || 'Could not check waiting request'
    );
  }

  const pendingRequest = existing.find(
  (request) => request.status === 'PENDING'
);

if (pendingRequest) {
  const { data, errors } =
    await dataClient.models.WaitingRequest.update({
      id: pendingRequest.id,
      displayName: user.displayName,
      status: 'PENDING',
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not refresh waiting request'
    );
  }

  return { request: data };
}

  const { data, errors } =
    await dataClient.models.WaitingRequest.create({
      roomId: room.id,
      userId: user.id,
      displayName: user.displayName,
      status: 'PENDING',
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not request access'
    );
  }

  return { request: data };
},
subscribeToWaitingRequests(roomId, onCreate, onUpdate) {
  const createSub = dataClient.models.WaitingRequest.onCreate().subscribe({
    next: (request) => {
      if (request.roomId === roomId) {
        onCreate?.(request);
      }
    },
    error: (err) => {
      console.error('Waiting request subscription error:', err);
    },
  });

  const updateSub = dataClient.models.WaitingRequest.onUpdate().subscribe({
    next: (request) => {
      if (request.roomId === roomId) {
        onUpdate?.(request);
      }
    },
    error: (err) => {
      console.error('Waiting request update error:', err);
    },
  });

  return () => {
    createSub.unsubscribe();
    updateSub.unsubscribe();
  };
},
async approveWaitingRequest(requestId, roomId, userId, displayName) {
  const { errors: memberErrors } =
    await dataClient.models.RoomMember.create({
      roomId,
      userId,
      displayName,
      role: 'MEMBER',
    });

  if (memberErrors?.length) {
    throw new Error(
      memberErrors[0].message || 'Could not approve user'
    );
  }

  const { errors: requestErrors } =
    await dataClient.models.WaitingRequest.update({
      id: requestId,
      status: 'APPROVED',
    });

  if (requestErrors?.length) {
    throw new Error(
      requestErrors[0].message || 'Could not update waiting request'
    );
  }
},

async rejectWaitingRequest(requestId) {
  const { errors } =
    await dataClient.models.WaitingRequest.update({
      id: requestId,
      status: 'REJECTED',
    });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not reject user'
    );
  }
},
 subscribeToRoomMembers(roomId, onJoin, onLeave, onUpdate) {
  const createSub = dataClient.models.RoomMember.onCreate().subscribe({
    next: (member) => {
      if (member.roomId === roomId) {
        onJoin?.(member);
      }
    },
    error: (err) => {
      console.error('Room member create subscription error:', err);
    },
  });

  const updateSub = dataClient.models.RoomMember.onUpdate().subscribe({
    next: (member) => {
      if (member.roomId === roomId) {
        onUpdate?.(member);
      }
    },
    error: (err) => {
      console.error('Room member update subscription error:', err);
    },
  });

  const deleteSub = dataClient.models.RoomMember.onDelete().subscribe({
    next: (member) => {
      if (member.roomId === roomId) {
        onLeave?.(member);
      }
    },
    error: (err) => {
      console.error('Room member delete subscription error:', err);
    },
  });

  return () => {
    createSub.unsubscribe();
    updateSub.unsubscribe();
    deleteSub.unsubscribe();
  };
},
async joinRoom(code, user, password) {
  const { room } = await this.getRoom(code);

  if (!room) {
    throw new Error('Room not found.');
  }

  // Private room password check
  if (room.isPrivate) {
    if (!password) {
      const err = new Error('This room needs a password.');
      err.status = 401;
      throw err;
    }

    const { data: verifyResult, errors: verifyErrors } =
      await dataClient.mutations.verifyRoomPassword({
        action: 'verify',
        roomId: room.id,
        password,
      });

    if (verifyErrors?.length) {
      throw new Error(
        verifyErrors[0].message || 'Could not verify room password'
      );
    }

    if (!verifyResult?.valid) {
      const err = new Error('Incorrect room password.');
      err.status = 401;
      throw err;
    }
  }

  // Load current members
  const { members: existingMembers } =
    await this.getRoomMembers(room.id);

  const alreadyJoined = existingMembers.some(
    (member) => member.userId === user.id
  );

  // Locked room: existing members + host may rejoin,
  // but a new user cannot enter.
  if (
  room.isLocked &&
  room.ownerId !== user.id &&
  !alreadyJoined
) {
  const { request } = await this.requestToJoin(room, user);

  return {
    room,
    waiting: true,
    request,
  };
}

  // Capacity check
  if (
    !alreadyJoined &&
    existingMembers.length >= (room.maxParticipants || 8)
  ) {
    throw new Error(
      `Room is full. Maximum ${room.maxParticipants || 8} participants allowed.`
    );
  }

  // Add new participant
  if (!alreadyJoined) {
    const { errors: memberErrors } =
      await dataClient.models.RoomMember.create({
        roomId: room.id,
        userId: user.id,
        displayName: user.displayName,
        role: room.ownerId === user.id ? 'HOST' : 'MEMBER',
      });

    if (memberErrors?.length) {
      throw new Error(
        memberErrors[0].message || 'Could not join room'
      );
    }
  }

  return { room };
},
async leaveRoom(roomId, userId) {
  const { members } = await this.getRoomMembers(roomId);

  const member = members.find(
    (item) => item.userId === userId
  );

  if (!member) {
    return;
  }

  const { errors } = await dataClient.models.RoomMember.delete({
    id: member.id,
  });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not leave room'
    );
  }
},
async deleteRoom(id) {
  const { members } = await this.getRoomMembers(id);

  for (const member of members) {
    await dataClient.models.RoomMember.delete({
      id: member.id,
    });
  }

  const { data: messages } = await dataClient.models.Message.list({
    filter: {
      roomId: {
        eq: id,
      },
    },
  });

  for (const message of messages) {
    await dataClient.models.Message.delete({
      id: message.id,
    });
  }

  const { data, errors } = await dataClient.models.Room.delete({
    id,
  });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not delete room'
    );
  }

  return data;
},

async removeMember(roomId, userId) {
  const { members } = await this.getRoomMembers(roomId);

  const member = members.find(
    (item) => item.userId === userId
  );

  if (!member) {
    return;
  }

  const { errors } = await dataClient.models.RoomMember.delete({
    id: member.id,
  });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not remove participant'
    );
  }
},
async setMemberRole(roomId, userId, role) {
  const { members } = await this.getRoomMembers(roomId);

  const member = members.find(
    (item) => item.userId === userId
  );

  if (!member) {
    throw new Error('Participant not found');
  }

  const { data, errors } = await dataClient.models.RoomMember.update({
    id: member.id,
    role,
  });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not update participant role'
    );
  }

  return { member: data };
},
async setRoomLock(id, isLocked) {
  const { data, errors } = await dataClient.models.Room.update({
    id,
    isLocked,
  });

  if (errors?.length) {
    throw new Error(
      errors[0].message || 'Could not update room lock'
    );
  }

  return { room: data };
},
  async updateRoom(id, patch) {
    const { data, errors } = await dataClient.models.Room.update({
      id,
      ...patch,
    });

    if (errors?.length) {
      throw new Error(errors[0].message || 'Could not update room');
    }

    return { room: data };
  },
};