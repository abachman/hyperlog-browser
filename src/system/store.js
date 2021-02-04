import levelup from "levelup";
// import leveljs from "level-js";
import memdown from "memdown";
import subleveldown from "subleveldown";
import cuid from "cuid";
import { Swarm } from "../swarm";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import {
  messagesReducer,
  peersReducer,
  messagesActions,
  peersActions,
  userReducer,
  userActions,
} from "./slices";
import * as idb from "idb-keyval";

export const clientid = cuid();
const maindb = levelup(memdown());
export const db = subleveldown(maindb, `chat-${clientid}`);

const reducer = {
  messages: messagesReducer,
  peers: peersReducer,
  user: userReducer,
};

// local storage persistence
const locality = (store) => (next) => (action) => {
  switch (action.type) {
    case userActions.setUsername.type:
      console.log("locality persisting username");
      idb.set("client.username", action.payload);
      break;

    default:
      break;
  }

  return next(action);
};

const logger = createLogger({ collapsed: true });
const middlewares = getDefaultMiddleware({
  serializableCheck: {
    ignoredActions: [peersActions.add.type],
    ignoredPaths: ["peers.peers"],
  },
}).concat([logger, locality]);

const store = configureStore({
  preloadedState: {
    user: {
      username: clientid,
      uid: clientid,
    },
  },
  reducer,
  middleware: middlewares,
  devTools: process.env.NODE_ENV !== "production",
});

export { store };

// ----- local storage

idb.get("client.username").then((value) => {
  if (value) {
    store.dispatch(userActions.setUsername(value));
  }
});

// ----- replication

const swarm = new Swarm(db, "http://house.chat:8080/signal");

swarm.on("message", (message) => {
  console.log("got new message", message);
  store.dispatch(messagesActions.add(message));
});

swarm.on("peer", (peer, id) => {
  console.log("got new peer", peer, "with id", id);
  store.dispatch(peersActions.add({ id }));
});

swarm.on("push", (id) => {
  console.log("swarm:push", id);
});

swarm.on("pull", (id) => {
  console.log("swarm:pull", id);
});

swarm.on("peer:disconnect", (peer, id) => {
  console.log("peer with id", id, "disconnected");
  store.dispatch(peersActions.remove({ id }));
});

export const sendMessage = (text) => (_, getState) => {
  const { user } = getState();
  console.log("sending message as", user);
  swarm.send(user, text);
};
