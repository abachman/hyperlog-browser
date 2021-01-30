import { createSlice } from "@reduxjs/toolkit";

const messageState = {
  messages: [],
};

const messages = createSlice({
  name: "messages",
  initialState: messageState,
  reducers: {
    add(state, action) {
      state.messages.push(action.payload);
    },
  },
});

export const messagesReducer = messages.reducer;
export const messagesActions = messages.actions;

//------------------------------------------------------

const peerState = {
  peers: {},
};

const peers = createSlice({
  name: "peers",
  initialState: peerState,
  reducers: {
    add(state, action) {
      state.peers[action.id] = action.peer;
    },

    remove(state, action) {
      delete state.peers[action.id];
    },
  },
});

export const peersReducer = peers.reducer;
export const peersActions = peers.actions;

//------------------------------------------------------

const userState = {
  username: "",
  uid: "",
};

const user = createSlice({
  name: "user",
  initialState: userState,
  reducers: {
    setUsername(state, action) {
      state.username = action.payload;
    },
  },
});

export const userReducer = user.reducer;
export const userActions = user.actions;
