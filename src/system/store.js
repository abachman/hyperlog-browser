import levelup from 'levelup'
// import leveljs from "level-js";
import memdown from 'memdown'
import subleveldown from 'subleveldown'
import cuid from 'cuid'
import { Swarm } from '../swarm'
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'
import {
  messagesReducer,
  peersReducer,
  messagesActions,
  peersActions,
  userReducer,
  userActions,
} from './slices'
import * as idb from 'idb-keyval'
;(async function () {
  const existing = await idb.get('client')
  if (!existing || !existing.id) {
    // create a unique id for this browser on first visit
    let clientid = cuid()
    // and store it in the local indexedDB
    await idb.set('client', { username: clientid, id: clientid })
  }
})()

const maindb = levelup(memdown())
export const db = subleveldown(maindb, `general`)

const reducer = {
  messages: messagesReducer,
  peers: peersReducer,
  user: userReducer,
}

// local storage persistence
const locality = (store) => (next) => (action) => {
  switch (action.type) {
    case userActions.set.type:
      idb.set('client', action.payload)
      break

    default:
      break
  }

  return next(action)
}

const logger = createLogger({ collapsed: true })
const middlewares = getDefaultMiddleware().concat([logger, locality])

const store = configureStore({
  preloadedState: {},
  reducer,
  middleware: middlewares,
  devTools: process.env.NODE_ENV !== 'production',
})

const handleReset = () => {
  const { user } = store.getState()
  if (user.reset) {
    idb.set('client', { username: user.username, id: user.id })
    store.dispatch(userActions.clean())
  }
}

store.subscribe(handleReset)

export { store }

// ----- local storage

idb.get('client').then((value) => {
  if (value) {
    store.dispatch(userActions.set(value))
  }
})

// ----- replication

const swarm = new Swarm(db, 'http://house.chat:8080/signal')

swarm.on('message', (message) => {
  store.dispatch(messagesActions.add(message))
})

swarm.on('peer', (peer, id) => {
  console.log('got new peer', peer, 'with id', id)
  store.dispatch(peersActions.add({ id }))
})

swarm.on('peer:disconnect', (peer, id) => {
  console.log('peer with id', id, 'disconnected')
  store.dispatch(peersActions.remove({ id }))
})

swarm.on('push', (id) => {
  console.log('swarm:push', id)
})

swarm.on('pull', (id) => {
  console.log('swarm:pull', id)
})

window.SWARM = swarm

export const sendMessage = (text) => (_, getState) => {
  const { user } = getState()
  swarm.send(user, text)
}
