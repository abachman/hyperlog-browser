import EventEmitter from 'eventemitter3'
import { Mesh } from 'webrtc-mesh'
import protobuf from 'protocol-buffers'
import subleveldown from 'subleveldown'
import hyperlog from 'hyperlog'

const schema = protobuf(`
  message Message {
    optional uint64 timestamp = 1;
    optional string text = 2;
    optional string username = 3;
    optional string uid = 4;
    optional string pid = 5;
  }
`)

class Swarm extends EventEmitter {
  constructor(db, wsurl) {
    super()

    this.mesh = new Mesh({
      signalsUrl: wsurl,
      appName: 'house.chat',
    })

    this.mesh.on('peer', (peer, id) => {
      console.log('mesh gave us a peer')
      this.onconnect(peer, id)
    })

    this.mesh.on('disconnect', (peer, id) => {
      this.ondisconnect(peer, id)
    })

    this.id = this.mesh.me
    this.db = db

    this.logs = {}
    this.peers = {}
    this.replicationStreams = {} // log.replicate
    this.readStreams = {} // log.createReadStream

    this.logs['root'] = this.log = hyperlog(subleveldown(db, 'messages'))
    this.startProcessor('root', this.log)

    console.log(
      `------------------ ${this.id} swarm started ------------------`
    )
  }

  onconnect(peer, id) {
    if (this.peers[id]) return
    this.peers[id] = peer

    // hyper
    const stream = this.log.replicate({ live: true })
    stream.pipe(peer).pipe(stream)

    stream.on('push', () => {
      this.emit('push', id)
    })

    stream.on('pull', () => {
      this.emit('pull', id)
    })

    this.replicationStreams[id] = stream

    this.emit('peer', peer, id)
  }

  ondisconnect(peer, id) {
    this.emit('peer:disconnect', peer, id)
  }

  onclose(id) {
    delete this.peers[id]
    this.emit('close', id)
  }

  startProcessor(key, log) {
    log.ready(() => {
      if (log.processing) return
      log.processing = true

      const rs = log.createReadStream({
        live: true,
      })

      rs.on('data', (data) => {
        const m = schema.Message.decode(data.value)
        this.emit('message', m)
      })

      this.readStreams[key] = rs
    })
  }

  send(user, val) {
    const message = {
      timestamp: Date.now(),
      text: val,
      username: user.username,
      uid: user.id,
      pid: this.id,
    }

    this.log.heads((err, heads) => {
      if (err) {
        console.error('failed to get heads', err)
        return
      }

      this.log.add(heads, schema.Message.encode(message), () => {
        // console.log('added')
      })
    })
  }

  close() {
    for (const peer of Object.values(this.peers)) {
      peer.destroy()
    }
  }
}

export { Swarm }
