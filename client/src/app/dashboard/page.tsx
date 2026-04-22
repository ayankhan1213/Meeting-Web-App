"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Link as LinkIcon,
  Video,
  Users,
  Clock,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";

function generateRoomId(): string {
  const seg = () => Math.random().toString(36).substring(2, 6);
  return `${seg()}-${seg()}-${seg()}`;
}

function getUserName(): string {
  return sessionStorage.getItem("meetspace_username") || "";
}

// ── Name prompt modal (shown if name not yet set) ─────────────────────────────
function NamePrompt({
  onConfirm,
}: {
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel-2 w-full max-w-sm p-8"
      >
        <h2 className="font-bold text-xl text-white mb-1">Welcome back!</h2>
        <p className="text-gray-400 text-sm mb-6">
          What should we call you in meetings?
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onConfirm(name.trim());
          }}
          className="flex flex-col gap-4"
        >
          <input
            id="dashboard-name-input"
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
            disabled={!name.trim()}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Continue <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("meetspace_username") || "";
    }
    return "";
  });

  const handleNameSet = (name: string) => {
    sessionStorage.setItem("meetspace_username", name);
    setUserName(name);
  };

  const handleCreate = () => {
    const code = generateRoomId();
    router.push(`/room/${code}`);
  };

  const handleJoin = () => {
    if (!meetingCode.trim()) return;
    const extracted = meetingCode.includes("/")
      ? meetingCode.split("/").pop()!
      : meetingCode.trim();
    router.push(`/room/${extracted}`);
  };

  const handleCopyDemo = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const avatarInitial = userName.charAt(0).toUpperCase() || "?";

  const recentMeetings = [
    { id: "proj-alpha", name: "Project Alpha Sync", time: "Today, 09:00 AM", participants: 4 },
    { id: "design-review", name: "Design Review", time: "Yesterday, 2:30 PM", participants: 6 },
    { id: "team-standup", name: "Team Standup", time: "Mon, 10:00 AM", participants: 8 },
  ];

  if (!userName) {
    return <NamePrompt onConfirm={handleNameSet} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col grid-bg">
      {/* Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="h-16 glass-panel border-x-0 border-t-0 rounded-none px-6 flex items-center justify-between z-10 shrink-0 relative">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl avatar-gradient flex items-center justify-center">
            <Video size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            Meet<span className="text-gradient">Space</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:block">{userName}</span>
          <div className="w-9 h-9 rounded-full avatar-gradient flex items-center justify-center font-bold text-sm text-white shadow-neon-primary">
            {avatarInitial}
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-6xl w-full mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 mt-2"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Good{" "}
            {new Date().getHours() < 12
              ? "Morning"
              : new Date().getHours() < 18
              ? "Afternoon"
              : "Evening"}
            , <span className="text-gradient">{userName}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1">Ready for your next session?</p>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Create */}
          <motion.button
            id="create-meeting-btn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            className="glass-panel p-7 flex flex-col justify-between min-h-[10rem] text-left relative overflow-hidden group cursor-pointer border-primary/20"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-[60px] transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl avatar-gradient flex items-center justify-center mb-4 shadow-neon-primary">
              <Plus size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Meeting</h2>
              <p className="text-gray-400 text-sm mt-1">
                Start an instant room — you become the host
              </p>
            </div>
          </motion.button>

          {/* Join */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel p-7 flex flex-col justify-between min-h-[10rem] relative overflow-hidden border-secondary/20"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-[60px] transform translate-x-10 -translate-y-10 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-secondary/20 border border-secondary/30 text-secondary flex items-center justify-center mb-4">
              <LinkIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-3">
                Join Meeting
              </h2>
              <div className="flex gap-2">
                <input
                  id="join-code-input"
                  type="text"
                  placeholder="Meeting code or link..."
                  className="input-field text-sm py-2.5"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
                <button
                  id="join-meeting-btn"
                  disabled={!meetingCode.trim()}
                  onClick={handleJoin}
                  className="btn-primary px-4 py-2.5 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary-light" />
            Recent Meetings
          </h2>
          <div className="glass-panel divide-y divide-white/5">
            {recentMeetings.map((meeting, idx) => (
              <div
                key={meeting.id}
                className="p-4 flex items-center justify-between hover:bg-white/3 transition-colors group"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary-light flex items-center justify-center shrink-0">
                    <Video size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {meeting.name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} />
                      {meeting.time}
                      <span className="mx-1 text-gray-600">·</span>
                      <Users size={10} />
                      {meeting.participants} participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyDemo(meeting.id)}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy link"
                  >
                    {copied === meeting.id ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => router.push(`/room/${meeting.id}`)}
                    className="px-3 py-1.5 btn-primary text-xs cursor-pointer"
                  >
                    Rejoin
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
