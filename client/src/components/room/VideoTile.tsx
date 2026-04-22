"use client";
import { useEffect, useRef } from "react";
import { MicOff, Hand } from "lucide-react";
import { motion } from "framer-motion";

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isLocal?: boolean;
  raisedHand?: boolean;
  isSpeaking?: boolean;
}

export function VideoTile({
  stream,
  name,
  isMuted,
  isVideoOff,
  isLocal = false,
  raisedHand,
  isSpeaking,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative rounded-2xl overflow-hidden bg-[#0d1117] border aspect-video group
        ${isSpeaking ? "border-primary shadow-neon-primary" : "border-white/8"}
      `}
    >
      {/* Video element */}
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
          <div className="w-16 h-16 rounded-full avatar-gradient flex items-center justify-center text-2xl font-bold text-white shadow-neon-primary">
            {initial}
          </div>
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-white truncate">
          {name}
          {isLocal && (
            <span className="ml-1 text-primary-light text-[10px]">(You)</span>
          )}
        </span>
        {isMuted && <MicOff size={12} className="text-red-400 shrink-0" />}
      </div>

      {/* Raised hand badge */}
      {raisedHand && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
        >
          <Hand size={14} className="text-black" fill="currentColor" />
        </motion.div>
      )}

      {/* Speaking ring */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none animate-pulse" />
      )}
    </motion.div>
  );
}
