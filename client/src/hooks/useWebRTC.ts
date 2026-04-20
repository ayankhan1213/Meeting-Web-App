import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId: string) => {
  const [peers, setPeers] = useState<{ [key: string]: RTCPeerConnection }>({});
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        
        socket.current?.emit('join-room', roomId, socket.current.id);

        socket.current?.on('user-connected', (userId: string) => {
          const peerConnection = createPeerConnection(userId);
          
          peerConnection.createOffer().then(offer => {
            peerConnection.setLocalDescription(offer);
            socket.current?.emit('offer', { target: userId, caller: socket.current?.id, sdp: offer });
          });
        });

        socket.current?.on('offer', async (payload: any) => {
          const peerConnection = createPeerConnection(payload.caller);
          await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          socket.current?.emit('answer', { target: payload.caller, caller: socket.current?.id, sdp: answer });
        });

        socket.current?.on('answer', async (payload: any) => {
          const pc = peers[payload.caller];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
        });

        socket.current?.on('ice-candidate', async (incoming: any) => {
          const pc = peers[incoming.target];
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(incoming.candidate));
          }
        });

      } catch (error) {
        console.error('Error accessing media devices', error);
      }
    };

    initMedia();

    return () => {
      socket.current?.disconnect();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [roomId, peers]);

  const createPeerConnection = (userId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current?.emit('ice-candidate', { target: userId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };

    setPeers(prev => ({ ...prev, [userId]: pc }));
    return pc;
  };

  return { localStream, remoteStreams };
};
