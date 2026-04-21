import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface RoomData {
  hostId: string;
  participants: Set<string>;
  waitingList: Set<string>;
}

const rooms = new Map<string, RoomData>();

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, { 
    cors: { 
      origin: '*', 
      methods: ["GET", "POST"]
    } 
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', (roomId: string, userId: string) => {
      let room = rooms.get(roomId);

      // If room doesn't exist, create it and make this user the host
      if (!room) {
        room = {
          hostId: socket.id,
          participants: new Set([socket.id]),
          waitingList: new Set()
        };
        rooms.set(roomId, room);
        
        socket.join(roomId);
        socket.emit('joined-as-host', { roomId, userId });
        console.log(`User ${userId} created and joined room ${roomId} as HOST`);
      } else {
        // Room exists, user must request to join
        room.waitingList.add(socket.id);
        io.to(room.hostId).emit('join-request', { 
          userId: socket.id, 
          userName: userId 
        });
        socket.emit('waiting-for-approval', { roomId });
        console.log(`User ${userId} is waiting for approval in room ${roomId}`);
      }
    });

    socket.on('approve-user', ({ roomId, targetUserId }: { roomId: string, targetUserId: string }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.waitingList.delete(targetUserId);
        room.participants.add(targetUserId);
        
        const targetSocket = io.sockets.sockets.get(targetUserId);
        if (targetSocket) {
          targetSocket.join(roomId);
          targetSocket.emit('join-approved', { roomId });
          // Notify others in the room
          targetSocket.to(roomId).emit('user-connected', targetUserId);
        }
      }
    });

    socket.on('deny-user', ({ roomId, targetUserId }: { roomId: string, targetUserId: string }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.waitingList.delete(targetUserId);
        io.to(targetUserId).emit('join-denied', { roomId });
      }
    });

    // WebRTC Signaling
    socket.on('offer', (payload: { target: string, sdp: any }) => {
      io.to(payload.target).emit('offer', { sdp: payload.sdp, from: socket.id });
    });

    socket.on('answer', (payload: { target: string, sdp: any }) => {
      io.to(payload.target).emit('answer', { sdp: payload.sdp, from: socket.id });
    });

    socket.on('ice-candidate', (payload: { target: string, candidate: any }) => {
      io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, from: socket.id });
    });

    // Chat and UI events
    socket.on('send-message', (messagePayload: { roomId: string, sender: string, text: string }) => {
      io.to(messagePayload.roomId).emit('receive-message', messagePayload);
    });

    socket.on('send-emoji', ({ roomId, emoji }: { roomId: string, emoji: string }) => {
      io.to(roomId).emit('receive-emoji', { userId: socket.id, emoji });
    });

    socket.on('toggle-mute', ({ roomId, isMuted }: { roomId: string, isMuted: boolean }) => {
      socket.to(roomId).emit('participant-muted', { userId: socket.id, isMuted });
    });

    socket.on('toggle-video', ({ roomId, isVideoOff }: { roomId: string, isVideoOff: boolean }) => {
      socket.to(roomId).emit('participant-video-off', { userId: socket.id, isVideoOff });
    });

    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id);
          socket.to(roomId).emit('user-disconnected', socket.id);
          
          if (room.hostId === socket.id) {
            if (room.participants.size > 0) {
              const nextHostId = Array.from(room.participants)[0];
              room.hostId = nextHostId;
              io.to(nextHostId).emit('became-host', { roomId });
            } else {
              rooms.delete(roomId);
            }
          }
        }
        if (room.waitingList.has(socket.id)) {
          room.waitingList.delete(socket.id);
        }
      });
    });
  });

  return io;
};
