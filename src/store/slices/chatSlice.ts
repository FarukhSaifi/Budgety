import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ChatMessage } from "@/types";

interface ChatState {
  messages: ChatMessage[];
  open: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  open: false,
  status: "idle",
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
    toggleChatOpen(state) {
      state.open = !state.open;
    },
    addChatMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    setChatMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload;
    },
    setChatStatus(
      state,
      action: PayloadAction<{ status: ChatState["status"]; error?: string | null }>,
    ) {
      state.status = action.payload.status;
      state.error = action.payload.error ?? null;
    },
    clearChat(state) {
      state.messages = [];
      state.status = "idle";
      state.error = null;
    },
  },
});

export const {
  setChatOpen,
  toggleChatOpen,
  addChatMessage,
  setChatMessages,
  setChatStatus,
  clearChat,
} = chatSlice.actions;
export default chatSlice.reducer;
