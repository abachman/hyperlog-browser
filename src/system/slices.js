import cuid from 'cuid'
import { createSlice } from '@reduxjs/toolkit'

//--[ messages ]----------------------------------------------------

const messageState = {
  messages: {},
}

/*
message Message {
  optional uint64 timestamp = 1;
  optional string text = 2;
  optional string username = 3;
  optional string uid = 4;
  optional string pid = 5
}
*/
const messages = createSlice({
  name: 'messages',
  initialState: messageState,
  reducers: {
    // action.payload: Message
    add(state, action) {
      const { timestamp, uid, text, username } = action.payload

      const existing = Object.values(state.messages).sort()
      const last = existing[existing.length - 1]
      if (last && last.uid === uid && last.username === username) {
        last.text = last.text + `\n${text}`
        state.messages[last.key] = last
      } else {
        const key = `${timestamp}${uid}`
        const message = {
          key,
          ...action.payload,
        }
        state.messages[key] = message
      }
    },
  },
})

export const messagesReducer = messages.reducer
export const messagesActions = messages.actions

//--[ peers ]----------------------------------------------------

const peerState = {
  peers: {}, // { [id: string]: { id: string, username: string } }
}

const peers = createSlice({
  name: 'peers',
  initialState: peerState,
  reducers: {
    add(state, action) {
      const { id } = action.payload
      state.peers[id] = {
        id: id,
        username: 'anon',
      }
    },

    remove(state, action) {
      const { id } = action.payload
      delete state.peers[id]
    },
  },

  extraReducers: (builder) => {
    builder.addCase(messagesActions.add.type, (state, action) => {
      const message = action.payload
      if (state.peers[message.pid]) {
        state.peers[message.pid].username = message.username
      }
    })
  },
})

export const peersReducer = peers.reducer
export const peersActions = peers.actions

//--[ everything ]---------------------------------------------

const data = createSlice({
  name: 'data',
  initialState: {},
  reducers: {
    reset(state) {
      return state
    },
  },
})

export const dataActions = data.actions

//--[ local user ]---------------------------------------------

const userState = {
  username: '',
  id: '',
  reset: false,
}

const user = createSlice({
  name: 'user',
  initialState: userState,
  reducers: {
    // payload { username, id }
    set(state, action) {
      return {
        ...state,
        ...action.payload,
      }
    },

    clean(state) {
      state.reset = false
    },
  },

  extraReducers: (builder) => {
    builder.addCase(dataActions.reset, (state) => {
      const id = cuid()
      return { id, username: id, reset: true }
    })
  },
})

export const userReducer = user.reducer
export const userActions = user.actions
