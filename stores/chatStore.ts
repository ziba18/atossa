// Today chat: conversations with Sage (POST /chat), kept ON THIS PHONE only (AsyncStorage, one
// key per signed-in user). Attachments are copied into the app's document folder and never
// uploaded — the AI only sees "[Attached a photo]" (no filename). Preview mode keeps chats in memory and
// answers with fixed follow-up questions (no network).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { ApiError, api } from '../lib/api';
import { contentOf } from '../lib/chatPayload';
import { IS_PREVIEW } from '../lib/preview/flag';

export interface ChatAttachment {
  id: string;
  kind: 'image' | 'file';
  uri: string;
  name: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachments?: ChatAttachment[];
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface ChatState {
  chats: Chat[];
  /** The open conversation; null = a fresh "new chat" that isn't saved until the first message. */
  activeId: string | null;
  loadedFor: string | null;
  sending: boolean;
  error: string;
  load: (userId: string | null) => Promise<void>;
  newChat: () => void;
  select: (id: string) => void;
  remove: (id: string) => void;
  send: (text: string, attachments?: ChatAttachment[]) => Promise<void>;
  retry: () => Promise<void>;
}

const MAX_HISTORY = 20; // matches the backend's MAX_MESSAGES
const keyFor = (userId: string) => `atossa.chats.v1.${userId}`;
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const PREVIEW_REPLIES = [
  'Thank you for telling me. Where in your body do you feel it?',
  'How long has this been going on?',
  'On a scale of 0 to 10, how strong is it at its worst?',
  'Has it stopped you doing anything you’d usually do?',
  'Is there anything that makes it better or worse?',
];

function titleFrom(text: string, attachments?: ChatAttachment[]): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t) return t.length > 48 ? `${t.slice(0, 47).trimEnd()}…` : t;
  const a = attachments?.[0];
  return a ? (a.kind === 'image' ? 'A photo' : a.name) : 'New chat';
}

function persist(userId: string | null, chats: Chat[]) {
  if (!userId || IS_PREVIEW) return;
  AsyncStorage.setItem(keyFor(userId), JSON.stringify(chats)).catch(() => {});
}

function deleteFiles(chat: Chat) {
  if (Platform.OS === 'web') return;
  // Lazy so web never loads the native module.
  import('expo-file-system').then(({ File }) => {
    for (const m of chat.messages) {
      for (const a of m.attachments ?? []) {
        try { const f = new File(a.uri); if (f.exists) f.delete(); } catch {}
      }
    }
  }).catch(() => {});
}

export const useChatStore = create<ChatState>((set, get) => {
  const update = (chats: Chat[], extra: Partial<ChatState> = {}) => {
    set({ chats, ...extra });
    persist(get().loadedFor, chats);
  };

  const ask = async (chatId: string) => {
    const chat = get().chats.find((c) => c.id === chatId);
    if (!chat) return;
    set({ sending: true, error: '' });
    try {
      let reply: string;
      if (IS_PREVIEW) {
        await new Promise((r) => setTimeout(r, 700));
        const asked = chat.messages.filter((m) => m.role === 'assistant').length;
        reply = PREVIEW_REPLIES[asked % PREVIEW_REPLIES.length];
      } else {
        // Recent history only, starting with her message (the API wants user-first, user-last).
        let history = chat.messages.slice(-MAX_HISTORY);
        while (history.length && history[0].role !== 'user') history = history.slice(1);
        const messages = history.map((m) => ({ role: m.role, content: contentOf(m) || '…' }));
        reply = (await api.post<{ reply: string }>('/chat', { messages })).reply;
      }
      const now = new Date().toISOString();
      const msg: ChatMessage = { id: uid(), role: 'assistant', text: reply, createdAt: now };
      update(
        get().chats.map((c) => (c.id === chatId ? { ...c, updatedAt: now, messages: [...c.messages, msg] } : c)),
        { sending: false },
      );
    } catch (e) {
      const busy = e instanceof ApiError && e.status === 429;
      set({
        sending: false,
        error: busy
          ? 'Lots of people are chatting right now. Try again in a moment.'
          : 'No reply came back. Check your connection and try again. Your message is saved.',
      });
    }
  };

  return {
    chats: [],
    activeId: null,
    loadedFor: null,
    sending: false,
    error: '',

    load: async (userId) => {
      if (get().loadedFor === userId) return;
      set({ chats: [], activeId: null, loadedFor: userId, sending: false, error: '' });
      if (!userId || IS_PREVIEW) return;
      try {
        const raw = await AsyncStorage.getItem(keyFor(userId));
        if (get().loadedFor !== userId) return; // signed out / switched while reading
        const chats = raw ? (JSON.parse(raw) as Chat[]) : [];
        set({ chats: Array.isArray(chats) ? chats : [] });
      } catch {
        // Unreadable history starts empty rather than blocking the screen.
      }
    },

    newChat: () => set({ activeId: null, error: '' }),

    select: (id) => set({ activeId: id, error: '' }),

    remove: (id) => {
      const chat = get().chats.find((c) => c.id === id);
      if (chat) deleteFiles(chat);
      update(get().chats.filter((c) => c.id !== id), get().activeId === id ? { activeId: null, error: '' } : {});
    },

    send: async (text, attachments) => {
      const words = text.trim();
      if ((!words && !attachments?.length) || get().sending) return;
      const now = new Date().toISOString();
      const msg: ChatMessage = {
        id: uid(), role: 'user', text: words, createdAt: now,
        ...(attachments?.length ? { attachments } : {}),
      };
      let id = get().activeId;
      let chats = get().chats;
      if (!id || !chats.some((c) => c.id === id)) {
        id = uid();
        chats = [{ id, title: titleFrom(words, attachments), createdAt: now, updatedAt: now, messages: [msg] }, ...chats];
      } else {
        chats = chats.map((c) => (c.id === id ? { ...c, updatedAt: now, messages: [...c.messages, msg] } : c));
      }
      update(chats, { activeId: id, error: '' });
      await ask(id);
    },

    retry: async () => {
      const id = get().activeId;
      if (id && !get().sending) await ask(id);
    },
  };
});

/** Copy a picked photo/file into the app's own folder so the OS can't clear it from the cache. */
export async function keepAttachment(a: Omit<ChatAttachment, 'id'>): Promise<ChatAttachment> {
  const id = uid();
  if (Platform.OS === 'web') return { ...a, id };
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'chat-attachments');
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const ext = /\.[A-Za-z0-9]{1,5}$/.exec(a.name)?.[0] ?? '';
    const dest = new File(dir, `${id}${ext}`);
    new File(a.uri).copy(dest);
    return { ...a, id, uri: dest.uri };
  } catch {
    return { ...a, id }; // keep the picker's copy rather than losing the attachment
  }
}

/** Sign-out and account deletion: remove this user's chats and attachments from the phone too. */
export async function clearLocalChats(userId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (raw) (JSON.parse(raw) as Chat[]).forEach(deleteFiles);
    await AsyncStorage.removeItem(keyFor(userId));
  } catch {}
}
