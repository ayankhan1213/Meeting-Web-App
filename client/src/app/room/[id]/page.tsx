"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Copy, Check, Users, MessageSquare, ArrowRight } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoTile } from "@/components/room/VideoTile";
import { ControlBar } from "@/components/room/ControlBar";
import { ChatPanel } from "@/components/room/ChatPanel";

// ── Name-entry modal (shown when user arrives without a name set) ─────────────
function NameEntryModal({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-[300] bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel-2 w-full max-w-sm p-8"
      >
        <div className="w-12 h-12 rounded-xl avatar-gradient flex items-center justify-center mb-4">
          <Video size={22} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">What's your name?</h2>
        <p className="text-gray-400 text-sm mb-6">
          You'll appear with this name in the meeting.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) {
              sessionStorage.setItem("meetspace_username", name.trim());
              onConfirm(name.trim());
            }
          }}
          className="flex flex-col gap-4"
        >
          <input
            id="room-name-input"
            autoFocus
            type="text"
            placeholder="Your display name"
            maxLength={40}
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            id="room-name-confirm"
            disabled={!name.trim()}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Enter Meeting <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Join-denied overlay ───────────────────────────────────────────────────────
function DeniedOverlay({ onLeave }: { onLeave: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 text-center p-6">
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
        <span className="text-3xl">🚫</span>
      </div>
      <h2 className="text-2xl font-bold text-white">Request Denied</h2>
      <p className="text-gray-400 max-w-sm">
        The host declined your request to join this meeting.
      </p>
      <button onClick={onLeave} className="btn-primary cursor-pointer">
        Back to Home
      </button>
    </div>
  );
}

// ── Waiting lobby overlay ─────────────────────────────────────────────────────
function WaitingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-6 text-center p-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Video size={28} className="text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white">Waiting for Host</h2>
      <p className="text-gray-400 max-w-sm">
        The host has been notified. You'll join automatically once approved.
      </p>
      <button onClick={onCancel} className="btn-ghost text-sm cursor-pointer">
        Cancel & Leave
      </button>
    </div>
  );
}

// ── Host join-request toasts ──────────────────────────────────────────────────
function JoinRequestToasts({
  requests,
  onApprove,
  onDeny,
}: {
  requests: { userId: string; userName: string }[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  return (
    <div className="fixed top-20 right-4 z-[150] flex flex-col gap-3 max-w-xs w-full">
      <AnimatePresence>
        {requests.map((req) => (
          <motion.div
            key={req.userId}
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="glass-panel-2 p-4 shadow-2xl border-primary/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full avatar-gradient flex items-center justify-center font-bold text-white text-sm shrink-0">
                {req.userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{req.userName}</p>
                <p className="text-xs text-gray-400">wants to join</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                id={`approve-${req.userId}`}
                onClick={() => onApprove(req.userId)}
                className="flex-1 py-2 btn-primary text-xs cursor-pointer"
              >
                Admit
              </button>
              <button
                id={`deny-${req.userId}`}
                onClick={() => onDeny(req.userId)}
                className="flex-1 py-2 btn-ghost text-xs cursor-pointer"
              >
                Deny
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Floating emoji reactions ──────────────────────────────────────────────────
function FloatingEmoji({ emoji }: { emoji: string }) {
  const x = useState(() => Math.random() * 70 + 15)[0];
  return (
    <motion.div
      initial={{ y: "100vh", x: `${x}vw`, opacity: 0, scale: 0.5 }}
      animate={{ y: "-5vh", opacity: [0, 1, 1, 0], scale: [0.5, 1.3, 1.2, 0.8] }}
      transition={{ duration: 3.5, ease: "easeOut" }}
      className="fixed text-5xl pointer-events-none z-[90]"
    >
      {emoji}
    </motion.div>
  );
}

// ── Video grid layout helper ──────────────────────────────────────────────────
function gridClass(total: number) {
  if (total === 1) return "grid-cols-1";
  if (total === 2) return "grid-cols-1 sm:grid-cols-2";
  if (total <= 4) return "grid-cols-2";
  if (total <= 6) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const router = useRouter();

  // Check if name is stored; if not, show name-entry first
  const [nameReady, setNameReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "chat" | "users">("none");
  const [copied, setCopied] = useState(false);

  // Resolve name from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("meetspace_username");
    if (stored?.trim()) setNameReady(true);
  }, []);

  // Listen for join-denied event
  useEffect(() => {
    const handler = () => setDenied(true);
    window.addEventListener("meetspace:join-denied", handler);
    return () => window.removeEventListener("meetspace:join-denied", handler);
  }, []);

  const {
    localStream,
    remoteStreams,
    participants,
    participantNames,
    participantStatus,
    messages,
    emojis,
    raisedHands,
    joinRequests,
    isWaiting,
    isHost,
    userName,
    sendMessage,
    sendEmoji,
    toggleRaiseHand,
    approveUser,
    denyUser,
    toggleRemoteMute,
    toggleRemoteVideo,
  } = useWebRTC(nameReady ? roomId : "");

  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !next));
    toggleRemoteMute(next);
  }, [isMuted, localStream, toggleRemoteMute]);

  const handleToggleVideo = useCallback(() => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !next));
    toggleRemoteVideo(next);
  }, [isVideoOff, localStream, toggleRemoteVideo]);

  const handleLeave = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Name-entry gate
  if (!nameReady) {
    return <NameEntryModal onConfirm={() => setNameReady(true)} />;
  }
  if (denied) {
    return <DeniedOverlay onLeave={() => router.push("/")} />;
  }

  const displayName = userName || sessionStorage.getItem("meetspace_username") || "You";
  const remoteEntries = Object.entries(remoteStreams);
  const totalTiles = 1 + remoteEntries.length;
  const participantCount = participants.length + 1;

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden relative grid-bg">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 glass-panel border-x-0 border-t-0 rounded-none px-4 flex items-center justify-between z-20">
        {/* Left: branding + room ID */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg avatar-gradient flex items-center justify-center">
            <Video size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-white hidden sm:block">
            {roomId}
          </span>
          {isHost && (
            <span className="text-[10px] bg-primary/20 text-primary-light border border-primary/30 px-2 py-0.5 rounded-full font-medium">
              HOST
            </span>
          )}
        </div>

        {/* Center: participant count */}
        <div className="flex items-center gap-1.5 text-sm text-gray-300">
          <Users size={15} className="text-primary-light" />
          <span>{participantCount} participant{participantCount !== 1 ? "s" : ""}</span>
        </div>

        {/* Right: copy link + sidebar toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Link"}</span>
          </button>
          <button
            id="participants-panel-btn"
            onClick={() => setActiveTab(activeTab === "users" ? "none" : "users")}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTab === "users" ? "bg-primary/20 text-primary" : "hover:bg-white/10 text-gray-400"}`}
          >
            <Users size={18} />
          </button>
          <button
            id="chat-panel-btn"
            onClick={() => setActiveTab(activeTab === "chat" ? "none" : "chat")}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTab === "chat" ? "bg-primary/20 text-primary" : "hover:bg-white/10 text-gray-400"}`}
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video grid */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar pb-24">
          <div className={`grid ${gridClass(totalTiles)} gap-3 h-full auto-rows-fr`}>
            {/* Local tile */}
            <VideoTile
              stream={localStream}
              name={displayName}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              isLocal
              raisedHand={raisedHands["self"]}
            />
            {/* Remote tiles */}
            {remoteEntries.map(([uid, stream]) => (
              <VideoTile
                key={uid}
                stream={stream}
                name={participantNames[uid] || "Participant"}
                isMuted={participantStatus[uid]?.isMuted}
                isVideoOff={participantStatus[uid]?.isVideoOff}
                raisedHand={raisedHands[uid]}
              />
            ))}
          </div>
        </main>

        {/* Chat / Participants sidebar */}
        <AnimatePresence>
          {activeTab !== "none" && (
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              className="
                fixed inset-0 z-[100]
                md:relative md:inset-auto md:w-80 md:shrink-0
                glass-panel-2 border-y-0 border-r-0 md:border-y md:border-r
                rounded-none flex flex-col overflow-hidden
              "
            >
              <ChatPanel
                activeTab={activeTab}
                onClose={() => setActiveTab("none")}
                messages={messages}
                onSendMessage={sendMessage}
                localName={displayName}
                participants={participants}
                participantNames={participantNames}
                participantStatus={participantStatus}
                isMuted={isMuted}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── FLOATING EMOJIS ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {emojis.map((e) => <FloatingEmoji key={e.id} emoji={e.emoji} />)}
      </AnimatePresence>

      {/* ── WAITING LOBBY ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isWaiting && <WaitingOverlay onCancel={() => { router.push("/"); }} />}
      </AnimatePresence>

      {/* ── JOIN REQUEST TOASTS (host only) ──────────────────────────────── */}
      {isHost && (
        <JoinRequestToasts
          requests={joinRequests}
          onApprove={approveUser}
          onDeny={denyUser}
        />
      )}

      {/* ── BOTTOM CONTROL BAR ───────────────────────────────────────────── */}
      <ControlBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isHandRaised={!!raisedHands["self"]}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleHand={() => toggleRaiseHand(!raisedHands["self"])}
        onSendEmoji={sendEmoji}
        onLeave={handleLeave}
      />
    </div>
  );
}
