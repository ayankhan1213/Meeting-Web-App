import { Server, Socket } from 'socket.io';

export const handleInteractionEvents = (io: Server, socket: Socket) => {
  socket.on('send-message', (payload: { roomId: string; sender: string; text: string }) => {
    // Broadcast including sender so all clients receive identical payload
    io.to(payload.roomId).emit('receive-message', {
      sender: payload.sender,
      text: payload.text,
      timestamp: Date.now(),
    });
  });

  socket.on('send-emoji', ({ roomId, emoji }: { roomId: string; emoji: string }) => {
    io.to(roomId).emit('receive-emoji', { userId: socket.id, emoji });
  });

  socket.on('raise-hand', ({ roomId, isRaised }: { roomId: string; isRaised: boolean }) => {
    io.to(roomId).emit('participant-raised-hand', { userId: socket.id, isRaised });
  });

  socket.on('toggle-mute', ({ roomId, isMuted }: { roomId: string; isMuted: boolean }) => {
    socket.to(roomId).emit('participant-muted', { userId: socket.id, isMuted });
  });

  socket.on('toggle-video', ({ roomId, isVideoOff }: { roomId: string; isVideoOff: boolean }) => {
    socket.to(roomId).emit('participant-video-off', { userId: socket.id, isVideoOff });
  });
};
