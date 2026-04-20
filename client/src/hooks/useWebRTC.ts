import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId: string) => {
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  
  const peers = useRef<{ [key: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const socket = useRef<Socket | null>(null);

  const sendMessage = (text: string, senderName: string = 'Anonymous') => {
    if (socket.current) {
      socket.current.emit('send-message', { roomId, sender: senderName, text });
    }
  };

  const toggleRemoteMute = (isMuted: boolean) => {
    if (socket.current) socket.current.emit('toggle-mute', isMuted);
  };

  const toggleRemoteVideo = (isVideoOff: boolean) => {
    if (socket.current) socket.current.emit('toggle-video', isVideoOff);
  };

  const [participantStatus, setParticipantStatus] = useState<{
    [userId: string]: { isMuted: boolean; isVideoOff: boolean };
  }>({});

  useEffect(() => {
    socket.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');

    socket.current.on('receive-message', (payload: {sender: string, text: string}) => {
      setMessages(prev => [...prev, payload]);
    });

    const createPeerConnection = (userId: string) => {
      // If we already have a connection to this user, don't create another one
      if (peers.current[userId]) return peers.current[userId];

      const pc = new RTCPeerConnection(ICE_SERVERS);
      
      // Add local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
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
        
        // Initialize status for new participant if not exists
        setParticipantStatus(prev => ({
          ...prev,
          [userId]: prev[userId] || { isMuted: false, isVideoOff: false }
        }));
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          handleUserDisconnect(userId);
        }
      };

      peers.current[userId] = pc;
      return pc;
    };

    const handleUserDisconnect = (userId: string) => {
      if (peers.current[userId]) {
        peers.current[userId].close();
        delete peers.current[userId];
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        setParticipantStatus(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    };

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }, 
          audio: true 
        });
        
        localStreamRef.current = stream;
        setLocalStream(stream);
        
      if (socket.current) {
        socket.current.on('connect', () => {
          console.log('Connected to signaling server:', socket.current?.id);
          if (socket.current?.id) {
            socket.current.emit('join-room', roomId, socket.current.id);
          }
        });

        socket.current.on('user-connected', async (userId: string) => {
          console.log('New user connected:', userId);
          const peerConnection = createPeerConnection(userId);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.current?.emit('offer', { target: userId, sdp: offer });
        });

        socket.current.on('offer', async (payload: { from: string; sdp: RTCSessionDescriptionInit }) => {
          console.log('Offer received from:', payload.from);
          const peerConnection = createPeerConnection(payload.from);
          await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          socket.current?.emit('answer', { target: payload.from, sdp: answer });
        });

        socket.current.on('answer', async (payload: { from: string; sdp: RTCSessionDescriptionInit }) => {
          console.log('Answer received from:', payload.from);
          const pc = peers.current[payload.from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
        });

        socket.current.on('ice-candidate', async (payload: { from: string; candidate: RTCIceCandidateInit }) => {
          const pc = peers.current[payload.from];
          if (pc && payload.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.error('Error adding ice candidate:', e);
            }
          }
        });
      }

        socket.current?.on('user-disconnected', (userId: string) => {
          console.log('User disconnected signal received:', userId);
          handleUserDisconnect(userId);
        });

        socket.current?.on('receive-message', (payload: any) => {
          setMessages(prev => [...prev, payload]);
        });

        socket.current?.on('participant-muted', ({ userId, isMuted }: any) => {
          setParticipantStatus(prev => ({
            ...prev,
            [userId]: { ...prev[userId], isMuted }
          }));
        });

        socket.current?.on('participant-video-off', ({ userId, isVideoOff }: any) => {
          setParticipantStatus(prev => ({
            ...prev,
            [userId]: { ...prev[userId], isVideoOff }
          }));
        });

      } catch (error) {
        console.error('Error accessing media devices', error);
      }
    };

    initMedia();

    return () => {
      socket.current?.disconnect();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      Object.values(peers.current).forEach(pc => pc.close());
      peers.current = {};
      setRemoteStreams({});
      setMessages([]);
      setParticipantStatus({});
    };
  }, [roomId]); 

  return { 
    localStream, 
    remoteStreams, 
    messages, 
    sendMessage, 
    participantStatus,
    toggleRemoteMute,
    toggleRemoteVideo
  };
};


