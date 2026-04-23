import { Server, Socket } from 'socket.io';
import { roomManager } from '../services/RoomManager';

export const handleRoomEvents = (io: Server, socket: Socket) => {
  // ── JOIN ─────────────────────────────────────────────────────────────────
  socket.on('join-room', (roomId: string, rawName: string, action: string = 'join') => {
    const userName = (rawName || 'Anonymous').trim().substring(0, 50);
    let room = roomManager.getRoom(roomId);

    if (!room) {
      if (action !== 'create') {
        socket.emit('room-not-found', { roomId });
        return;
      }
      // First user → becomes HOST
      room = roomManager.createRoom(roomId, socket.id, userName);
      socket.join(roomId);
      socket.emit('joined-as-host', {
        roomId,
        userId: socket.id,
        userName,
        participantNames: roomManager.getParticipantNames(roomId),
      });
      console.log(`[Room ${roomId}] HOST joined: ${userName} (${socket.id})`);
    } else {
      // Room exists — check for re-connect
      if (room.participants.has(socket.id)) {
        socket.join(roomId);
        socket.emit('join-approved', {
          roomId,
          participants: Array.from(room.participants).filter((id) => id !== socket.id),
          participantNames: roomManager.getParticipantNames(roomId),
        });
        return;
      }

      // Put user in waiting list and ask host
      roomManager.addWaitlist(roomId, socket.id, userName);
      io.to(room.hostId).emit('join-request', { userId: socket.id, userName });
      socket.emit('waiting-for-approval', { roomId });
      console.log(`[Room ${roomId}] Waiting: ${userName} (${socket.id})`);
    }
  });

  // ── APPROVE ──────────────────────────────────────────────────────────────
  socket.on('approve-user', ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    const targetSocket = io.sockets.sockets.get(targetUserId);
    if (!targetSocket) {
      // User disconnected while waiting
      roomManager.removeParticipant(roomId, targetUserId);
      return;
    }

    const targetName = room.participantNames.get(targetUserId) ?? 'Anonymous';
    roomManager.addParticipant(roomId, targetUserId, targetName);
    targetSocket.join(roomId);

    const existingParticipants = Array.from(room.participants).filter((id) => id !== targetUserId);
    const participantNames = roomManager.getParticipantNames(roomId);

    // Tell newcomer: here are the people already in the room
    targetSocket.emit('join-approved', {
      roomId,
      participants: existingParticipants,
      participantNames,
    });

    // Tell everyone else: a new user joined
    targetSocket.to(roomId).emit('user-connected', {
      userId: targetUserId,
      userName: targetName,
    });

    console.log(`[Room ${roomId}] APPROVED: ${targetName} (${targetUserId})`);
  });

  // ── DENY ─────────────────────────────────────────────────────────────────
  socket.on('deny-user', ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    roomManager.removeParticipant(roomId, targetUserId);
    io.to(targetUserId).emit('join-denied', { roomId });
    console.log(`[Room ${roomId}] DENIED: ${targetUserId}`);
  });

  // ── DISCONNECT ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const allRooms = roomManager.getAllRooms();

    allRooms.forEach((room, roomId) => {
      const isParticipant = room.participants.has(socket.id);
      const isWaiting = room.waitingList.has(socket.id);

      if (!isParticipant && !isWaiting) return;

      const userName = room.participantNames.get(socket.id) ?? 'User';

      if (isParticipant) {
        roomManager.removeParticipant(roomId, socket.id);
        // Notify remaining participants
        socket.to(roomId).emit('user-disconnected', { userId: socket.id, userName });

        // Transfer host if needed
        if (room.hostId === socket.id) {
          if (room.participants.size > 0) {
            const nextHostId = Array.from(room.participants)[0];
            roomManager.setNewHost(roomId, nextHostId);
            io.to(nextHostId).emit('became-host', { roomId });
            console.log(`[Room ${roomId}] Host transferred to ${nextHostId}`);
          } else {
            roomManager.deleteRoom(roomId);
            console.log(`[Room ${roomId}] Deleted (empty).`);
          }
        }
      } else if (isWaiting) {
        // Just remove from waitlist silently
        roomManager.removeParticipant(roomId, socket.id);
      }

      console.log(`[Room ${roomId}] User left: ${userName} (${socket.id})`);
    });
  });
};
