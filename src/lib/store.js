/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    messages: [], // { id: string, role: 'user' | 'model', content: string, image?: string }
    isGenerating: false,
    chat: null,

    addMessage: (role, content, image = null) =>
      set((state) => {
        state.messages.push({ id: crypto.randomUUID(), role, content, image });
      }),
    
    updateLastMessage: (content) =>
      set((state) => {
        if (state.messages.length > 0) {
          const lastMessage = state.messages[state.messages.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.content = content;
          }
        }
      }),

    setIsGenerating: (isGenerating) =>
      set((state) => {
        state.isGenerating = isGenerating;
      }),
    
    setChat: (chat) =>
      set((state) => {
        state.chat = chat;
      }),

    reset: () =>
      set((state) => {
        state.messages = [];
        state.isGenerating = false;
        state.chat = null;
      }),
  }))
);

export default useStore;
