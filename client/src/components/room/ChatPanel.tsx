"use client";
import { useRef, useEffect, useState } from "react";
import { Send, X, Users, MessageSquare, Mic, MicOff } from "lucide-react";
import type { Message } from "@/store/useMeetingStore";

interface ChatPanelProps {
  activeTab: "chat" | "users";
  onClose: () => void;
  messages: Message[];
  onSendMessage: (text: string) => void;
  localName: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantStatus: Record<string, { isMuted: boolean; isVideoOff: boolean }>;
  isMuted: boolean;
}

export function ChatPanel({
  activeTab, onClose, messages, onSendMessage,
  localName, participants, participantNames, participantStatus, isMuted,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          {activeTab === "chat"
            ? <><MessageSquare size={16} className="text-primary" /> Meeting Chat</>
            : <><Users size={16} className="text-primary" /> Participants ({participants.length + 1})</>
          }
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {activeTab === "chat" && (
          messages.length === 0
            ? <p className="text-center text-gray-500 text-sm mt-8">No messages yet. Say hello! 👋</p>
            : messages.map((msg) => {
                const isMe = msg.sender === localName;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <span className="text-[11px] text-gray-500 mb-1 px-1">{msg.sender}</span>
                    <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] break-words leading-relaxed
                      ${isMe
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white/8 text-gray-100 rounded-bl-sm border border-white/8"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
        )}

        {activeTab === "users" && (
          <div className="flex flex-col gap-1">
            {/* Self */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center text-xs font-bold text-white">
                  {localName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm text-white font-medium">{localName}</span>
                  <span className="ml-2 text-[10px] text-primary-light bg-primary/10 px-1.5 py-0.5 rounded-full">Host/You</span>
                </div>
              </div>
              {isMuted
                ? <MicOff size={14} className="text-red-400" />
                : <Mic size={14} className="text-green-400" />
              }
            </div>
            {/* Remote participants */}
            {participants.map((uid) => {
              const name = participantNames[uid] || "Participant";
              const status = participantStatus[uid];
              return (
                <div key={uid} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white">{name}</span>
                  </div>
                  {status?.isMuted
                    ? <MicOff size={14} className="text-red-400" />
                    : <Mic size={14} className="text-green-400" />
                  }
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input */}
      {activeTab === "chat" && (
        <form onSubmit={handleSend} className="p-3 border-t border-white/8 flex gap-2 shrink-0">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="input-field text-sm py-2"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
