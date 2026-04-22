"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  Globe,
  Lock,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
function generateRoomId(): string {
  const seg = () => Math.random().toString(36).substring(2, 6);
  return `${seg()}-${seg()}-${seg()}`;
}

// ── sub-components ───────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-panel p-6 flex flex-col gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── Name Modal ────────────────────────────────────────────────────────────────
function NameModal({
  mode,
  onConfirm,
  onClose,
}: {
  mode: "create" | "join";
  onConfirm: (name: string, code?: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === "join" && !code.trim()) return;
    onConfirm(name.trim(), code.trim() || undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25 }}
        className="glass-panel-2 w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl avatar-gradient flex items-center justify-center">
            {mode === "create" ? (
              <Video size={18} className="text-white" />
            ) : (
              <Users size={18} className="text-white" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">
              {mode === "create" ? "Start New Meeting" : "Join Meeting"}
            </h2>
            <p className="text-gray-400 text-sm">
              {mode === "create"
                ? "You'll be the host"
                : "Enter the meeting code"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Your Display Name
            </label>
            <input
              id="display-name-input"
              autoFocus
              type="text"
              placeholder="e.g. Alex Johnson"
              maxLength={40}
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {mode === "join" && (
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">
                Meeting Code or Link
              </label>
              <input
                id="meeting-code-input"
                type="text"
                placeholder="e.g. abc1-xyz2-def3"
                className="input-field"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-join-btn"
              disabled={
                !name.trim() || (mode === "join" && !code.trim())
              }
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none cursor-pointer"
            >
              {mode === "create" ? "Create Room" : "Join Now"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [modal, setModal] = useState<"create" | "join" | null>(null);

  const handleConfirm = (name: string, code?: string) => {
    sessionStorage.setItem("meetspace_username", name);
    if (modal === "create") {
      const roomId = generateRoomId();
      router.push(`/room/${roomId}`);
    } else if (code) {
      const extracted = code.includes("/") ? code.split("/").pop()! : code;
      router.push(`/room/${extracted}`);
    }
    setModal(null);
  };

  const features = [
    {
      icon: <Zap size={18} />,
      title: "Instant Rooms",
      desc: "Start a meeting in one click. Share the link and you're live.",
    },
    {
      icon: <Shield size={18} />,
      title: "Host Approval",
      desc: "Every participant must be approved by the host before joining.",
    },
    {
      icon: <Globe size={18} />,
      title: "Real-Time Chat",
      desc: "Persistent in-room chat with emoji reactions for everyone.",
    },
    {
      icon: <Lock size={18} />,
      title: "WebRTC P2P",
      desc: "Encrypted peer-to-peer audio & video — no middlemen.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden grid-bg">
      {/* Background orbs */}
      <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-primary/15 glow-orb pointer-events-none" />
      <div
        className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-secondary/10 glow-orb pointer-events-none"
        style={{ animationDelay: "3s" }}
      />

      {/* Navbar */}
      <nav className="w-full relative z-10 glass-panel border-x-0 border-t-0 rounded-none px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl avatar-gradient flex items-center justify-center shadow-neon-primary">
            <Video size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            Meet<span className="text-gradient">Space</span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            id="nav-join-btn"
            onClick={() => setModal("join")}
            className="btn-ghost text-sm px-4 py-2 cursor-pointer"
          >
            Join Meeting
          </button>
          <button
            id="nav-start-btn"
            onClick={() => setModal("create")}
            className="btn-primary text-sm px-4 py-2 cursor-pointer"
          >
            Start Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto w-full gap-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-primary/30 bg-primary/10 w-fit"
        >
          <Sparkles size={14} className="text-primary-light" />
          <span className="text-xs font-medium text-primary-light">
            Production-Ready · Multi-User · Real-Time
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white"
        >
          Meetings that{" "}
          <span className="text-gradient">actually work.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 text-lg max-w-2xl leading-relaxed"
        >
          No downloads. No accounts required. Click "Start", share the link, and
          your team joins the same room — with host approval to keep it secure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <button
            id="hero-start-btn"
            onClick={() => setModal("create")}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-base py-4 cursor-pointer"
          >
            <Video size={18} />
            Start a Meeting
          </button>
          <button
            id="hero-join-btn"
            onClick={() => setModal("join")}
            className="btn-ghost flex-1 flex items-center justify-center gap-2 text-base py-4 cursor-pointer"
          >
            <Users size={18} />
            Join with Code
          </button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4"
        >
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </motion.div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <NameModal
            mode={modal}
            onConfirm={handleConfirm}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
