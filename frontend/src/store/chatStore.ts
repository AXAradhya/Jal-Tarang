import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatSession, ChatMessage } from '../types';
import { copilotSessionApi } from '../api';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  searchQuery: string;
  isSidebarOpen: boolean;

  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  fetchSessions: (role?: string) => Promise<void>;
  createSession: (role?: string, title?: string, initialMessage?: ChatMessage) => string;
  switchSession: (id: string) => void;
  renameSession: (id: string, title: string) => Promise<void>;
  togglePinSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void;
  getActiveSession: () => ChatSession | undefined;
  exportSessionAsMarkdown: (sessionId: string) => void;
  exportSessionAsJson: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isLoading: false,
      searchQuery: '',
      isSidebarOpen: true,

      setSearchQuery: (query: string) => set({ searchQuery: query }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),

      fetchSessions: async (role?: string) => {
        set({ isLoading: true });
        try {
          const remoteSessions = await copilotSessionApi.list(role);
          if (Array.isArray(remoteSessions) && remoteSessions.length > 0) {
            set((state) => {
              // Merge remote with any existing locally created sessions not yet synced
              const existingMap = new Map(state.sessions.map((s) => [s.id, s]));
              remoteSessions.forEach((rs) => existingMap.set(rs.id, rs));
              const merged = Array.from(existingMap.values()).sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              );
              const activeId = state.activeSessionId && merged.some((s) => s.id === state.activeSessionId)
                ? state.activeSessionId
                : merged[0]?.id || null;

              return { sessions: merged, activeSessionId: activeId, isLoading: false };
            });
          } else {
            set({ isLoading: false });
          }
        } catch (err) {
          console.warn('[chatStore] Could not fetch remote sessions, fallback to local', err);
          set({ isLoading: false });
        }
      },

      createSession: (role = 'CHARTERING_MANAGER', title = 'New Conversation', initialMessage) => {
        const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();
        const newSession: ChatSession = {
          id,
          title,
          role,
          isPinned: false,
          messages: initialMessage ? [initialMessage] : [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }));

        // Asynchronously persist to backend
        copilotSessionApi.save(newSession).catch((err) =>
          console.warn('[chatStore] Failed to persist new session to backend', err)
        );

        return id;
      },

      switchSession: (id: string) => {
        set({ activeSessionId: id });
      },

      renameSession: async (id: string, title: string) => {
        const cleanTitle = title.trim();
        if (!cleanTitle) return;

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title: cleanTitle, updatedAt: new Date().toISOString() } : s
          ),
        }));

        try {
          await copilotSessionApi.update(id, { title: cleanTitle });
        } catch (err) {
          console.warn('[chatStore] Failed to update session title on server', err);
        }
      },

      togglePinSession: async (id: string) => {
        const session = get().sessions.find((s) => s.id === id);
        if (!session) return;
        const newPinned = !session.isPinned;

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, isPinned: newPinned, updatedAt: new Date().toISOString() } : s
          ),
        }));

        try {
          await copilotSessionApi.update(id, { isPinned: newPinned });
        } catch (err) {
          console.warn('[chatStore] Failed to update session pin status on server', err);
        }
      },

      deleteSession: async (id: string) => {
        set((state) => {
          const remaining = state.sessions.filter((s) => s.id !== id);
          let nextActiveId = state.activeSessionId;
          if (state.activeSessionId === id) {
            nextActiveId = remaining.length > 0 ? remaining[0].id : null;
          }
          return { sessions: remaining, activeSessionId: nextActiveId };
        });

        try {
          await copilotSessionApi.delete(id);
        } catch (err) {
          console.warn('[chatStore] Failed to delete session on server', err);
        }
      },

      clearAllSessions: async () => {
        set({ sessions: [], activeSessionId: null });
        try {
          await copilotSessionApi.clear();
        } catch (err) {
          console.warn('[chatStore] Failed to clear all sessions on server', err);
        }
      },

      addMessage: (sessionId, message) => {
        const now = new Date().toISOString();
        const fullMessage: ChatMessage = {
          ...message,
          id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: message.timestamp || now,
        };

        set((state) => {
          let updatedSession: ChatSession | null = null;

          const updatedSessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              let updatedTitle = s.title;
              // Auto-name untitled or default session on first user message
              if (
                (s.title === 'New Conversation' || s.title === 'Untitled Chat') &&
                fullMessage.role === 'user'
              ) {
                updatedTitle =
                  fullMessage.content.slice(0, 45).trim() +
                  (fullMessage.content.length > 45 ? '...' : '');
              }

              updatedSession = {
                ...s,
                title: updatedTitle,
                messages: [...s.messages, fullMessage],
                updatedAt: now,
              };
              return updatedSession;
            }
            return s;
          });

          // If session doesn't exist yet, create it
          if (!updatedSession) {
            const newTitle =
              fullMessage.role === 'user'
                ? fullMessage.content.slice(0, 45).trim() + (fullMessage.content.length > 45 ? '...' : '')
                : 'New Conversation';
            updatedSession = {
              id: sessionId,
              title: newTitle,
              role: fullMessage.roleContext || 'CHARTERING_MANAGER',
              isPinned: false,
              messages: [fullMessage],
              createdAt: now,
              updatedAt: now,
            };
            return {
              sessions: [updatedSession, ...state.sessions],
              activeSessionId: sessionId,
            };
          }

          // Sort sessions by most recently updated
          updatedSessions.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          return {
            sessions: updatedSessions,
            activeSessionId: sessionId,
          };
        });

        // Background sync to backend
        const currentUpdated = get().sessions.find((s) => s.id === sessionId);
        if (currentUpdated) {
          copilotSessionApi.save(currentUpdated).catch((err) =>
            console.warn('[chatStore] Background sync of updated session failed', err)
          );
        }
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) || sessions[0];
      },

      exportSessionAsMarkdown: (sessionId: string) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;

        let md = `# JAL TARANG Copilot — Operational Analysis Log\n\n`;
        md += `**Thread Title**: ${session.title}\n`;
        md += `**Role Context**: ${session.role}\n`;
        md += `**Created At**: ${new Date(session.createdAt).toLocaleString()}\n`;
        md += `**Last Updated**: ${new Date(session.updatedAt).toLocaleString()}\n`;
        md += `**Total Messages**: ${session.messages.length}\n\n`;
        md += `---\n\n`;

        session.messages.forEach((msg, idx) => {
          const isUser = msg.role === 'user';
          const senderLabel = isUser ? '👤 Operator Inquiry' : '🤖 JAL TARANG AI Copilot';
          const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          md += `### ${idx + 1}. ${senderLabel} (${time})\n\n`;
          md += `${msg.content}\n\n`;

          if (!isUser) {
            if (msg.source) md += `> **Source Data**: ${msg.source}\n`;
            if (msg.confidence) md += `> **Confidence Level**: ${(msg.confidence * 100).toFixed(1)}%\n`;
            if (msg.model) md += `> **Model**: ${msg.model}\n`;
            if (msg.suggestedFollowups && msg.suggestedFollowups.length > 0) {
              md += `\n**Suggested Followups:**\n`;
              msg.suggestedFollowups.forEach((f) => {
                md += `- ${f}\n`;
              });
            }
          }
          md += `\n---\n\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `${session.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)}_marinex_chat.md`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      exportSessionAsJson: (sessionId: string) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;

        const dataStr = JSON.stringify(session, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `${session.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)}_marinex_chat.json`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
    }),
    {
      name: 'sail_marinex_copilot_sessions_v1',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);
