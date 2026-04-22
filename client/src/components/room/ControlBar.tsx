"use client";
import { useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Hand, Smile, MonitorUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["👍","❤️","😂","👏","🔥","😮","💯","🚀","🎉","🙏","🤩","😢"];

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleHand: () => void;
  onSendEmoji: (emoji: string) => void;
  onLeave: () => void;
}

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-xl"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CtrlBtn({
  onClick, icon, danger, active, label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
  active?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl transition-all shrink-0 cursor-pointer
        ${danger
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
          : active
          ? "bg-primary/20 text-primary border border-primary/40"
          : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/8"
        }`}
    >
      {icon}
      {label && <span className="text-[10px] font-medium hidden sm:block">{label}</span>}
    </button>
  );
}

export function ControlBar({
  isMuted, isVideoOff, isHandRaised,
  onToggleMute, onToggleVideo, onToggleHand,
  onSendEmoji, onLeave,
}: ControlBarProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-fit overflow-x-auto no-scrollbar">
      <div className="glass-panel-2 px-2 py-2 sm:px-4 sm:py-3 flex items-center gap-1 sm:gap-3 shadow-2xl rounded-2xl mx-auto w-max">
        <Tooltip text={isMuted ? "Unmute" : "Mute"}>
          <CtrlBtn
            onClick={onToggleMute}
            icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            danger={isMuted}
            label={isMuted ? "Unmute" : "Mute"}
          />
        </Tooltip>

        <Tooltip text={isVideoOff ? "Start Video" : "Stop Video"}>
          <CtrlBtn
            onClick={onToggleVideo}
            icon={isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            danger={isVideoOff}
            label={isVideoOff ? "Start Cam" : "Stop Cam"}
          />
        </Tooltip>

        <div className="w-px h-8 bg-white/10" />

        <Tooltip text="Share Screen">
          <CtrlBtn
            onClick={() => {}}
            icon={<MonitorUp size={20} />}
            label="Share"
          />
        </Tooltip>

        {/* Emoji Picker */}
        <div className="relative">
          <Tooltip text="Reactions">
            <CtrlBtn
              onClick={() => setEmojiOpen((o) => !o)}
              icon={<Smile size={20} />}
              active={emojiOpen}
              label="React"
            />
          </Tooltip>
          <AnimatePresence>
            {emojiOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 glass-panel-2 p-3 grid grid-cols-4 gap-1.5 shadow-2xl min-w-[180px]"
              >
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { onSendEmoji(e); setEmojiOpen(false); }}
                    className="text-2xl p-1.5 rounded-lg hover:bg-white/10 hover:scale-125 transition-all cursor-pointer"
                  >
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Tooltip text={isHandRaised ? "Lower Hand" : "Raise Hand"}>
          <CtrlBtn
            onClick={onToggleHand}
            icon={<Hand size={20} fill={isHandRaised ? "currentColor" : "none"} />}
            active={isHandRaised}
            label={isHandRaised ? "Lower" : "Raise"}
          />
        </Tooltip>

        <div className="w-px h-8 bg-white/10" />

        <Tooltip text="Leave Meeting">
          <button
            onClick={onLeave}
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl p-2 sm:p-3 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all hover:scale-105 shrink-0 cursor-pointer"
          >
            <PhoneOff size={20} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
