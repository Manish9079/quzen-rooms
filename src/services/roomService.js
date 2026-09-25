import { apiClient } from './apiClient';
import { socketService } from './socketService';

function participantForUi(participant) {
  if (!participant) return participant;
  return {
    id: participant.id,
    userId: participant.user?.id || participant.userId,
    displayName: participant.user?.displayName || participant.displayName,
    role: participant.role,
    joinedAt: participant.joinedAt,
  };
}

export const roomService = {
  async createRoom(payload) {
    return apiClient.post('/rooms', payload);
  },

  async getPublicRooms(params = {}) {
    return apiClient.get(`/rooms/public${apiClient.query(params)}`);
  },

  async getMyRooms() {
    return apiClient.get('/rooms/mine');
  },

  async getRoom(code) {
    return apiClient.get(`/rooms/${encodeURIComponent(code)}`);
  },

  async getRoomMembers(code) {
    const { participants } = await apiClient.get(`/rooms/${encodeURIComponent(code)}/participants`);
    return {
      members: participants.map((participant) => ({
        id: participant.id,
        userId: participant.user.id,
        displayName: participant.user.displayName,
        role: participant.role,
        joinedAt: participant.joinedAt,
      })),
    };
  },

  async joinRoom(code, _user, password) {
    return apiClient.post(`/rooms/${encodeURIComponent(code)}/join`, { password });
  },

  async leaveRoom(code) {
    return apiClient.post(`/rooms/${encodeURIComponent(code)}/leave`);
  },

  async deleteRoom(code) {
    return apiClient.delete(`/rooms/${encodeURIComponent(code)}`);
  },

  async updateRoom(code, patch) {
    return apiClient.patch(`/rooms/${encodeURIComponent(code)}`, patch);
  },

  async setRoomLock(code, isLocked) {
    return this.updateRoom(code, { isLocked });
  },

  async removeMember(_code, userId) {
    return socketService.emitAck('host:removeParticipant', { userId });
  },

  async setMemberRole(_code, userId, role) {
    return socketService.emitAck(role === 'CO_HOST' ? 'host:setCoHost' : 'host:removeCoHost', { userId });
  },

  async approveWaitingRequest(_requestId, _code, userId) {
    return socketService.emitAck('host:approveWaiting', { userId });
  },

  async rejectWaitingRequest(_requestId, _code, userId) {
    return socketService.emitAck('host:rejectWaiting', { userId });
  },

  subscribeToRoomMembers(_code, onJoin, onLeave, onUpdate) {
    socketService.connect();
    const offJoin = socketService.on('presence:userJoined', (event) => onJoin?.(participantForUi(event.participant)));
    const offLeave = socketService.on('presence:userLeft', (event) => onLeave?.(event));
    const offRole = socketService.on('host:roleChanged', (event) => onUpdate?.(participantForUi(event.participant)));
    return () => [offJoin, offLeave, offRole].forEach((off) => off?.());
  },

  subscribeToWaitingRequests(_code, onCreate, onUpdate) {
    socketService.connect();
    return socketService.on('host:waitingRoomUpdate', ({ waiting }) => {
      waiting?.forEach(onCreate);
      onUpdate?.(waiting);
    });
  },
};
