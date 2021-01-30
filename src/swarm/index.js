import EventEmitter from "eventemitter3";
import SimplePeer from "simple-peer";
import protobuf from "protocol-buffers";
import subleveldown from "subleveldown";
import hyperlog from "hyperlog";

const schema = protobuf(`
  message Message {
    optional uint64 timestamp = 1;
    optional string text = 2;
    optional string username = 3;
    optional string uid = 4;
  }
`);

const ICE_SERVERS = [
  {
    urls: "stun:house.chat:3478",
  },
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:stun1.l.google.com:19302",
  },
  // {
  //   urls: "stun:stun2.l.google.com:19302",
  // },
  // {
  //   urls: "stun:stun3.l.google.com:19302",
  // },
  // {
  //   urls: "stun:stun4.l.google.com:19302",
  // },
];

window.DEBUG = "simple-peer";

// const peers = usePeers
class Swarm extends EventEmitter {
  constructor(db, ws, id) {
    super();

    this.ws = ws;
    this.id = id;
    this.db = db;

    this.log = hyperlog(subleveldown(db, "messages"));

    this.logs = {};
    this.initiator = false;

    // WebRTC signaling
    this.ws.subscribe("/swarm", this.onmember.bind(this)); // group joining
    this.ws.subscribe(`/${id}`, this.onsignal.bind(this)); // me specifically

    // { clientid: SimplePeer }
    this.peers = {};

    this.ws.publish("/swarm", { from: id, type: "join" });

    console.log(
      `------------------ ${id} swarm started -------------------------------------`
    );

    this.startProcessor(this.log);
  }

  // { type: 'join', id: clientid }
  onmember(data) {
    // ignore self-messaging
    if (data.from === this.id) return;

    console.log("new member", data);
    this.initiator = true;

    this.peerup(data, true);
  }

  peerup(data, initiator) {
    const peerid = data.from;

    if (this.peers[peerid]) {
      console.log("already have that peer");
      return;
    }

    const peer = (this.peers[peerid] = new SimplePeer({
      initiator,
      config: {
        iceServers: ICE_SERVERS,
      },
    }));

    peer.on("signal", (signal) => {
      console.log("get, then fwd signal", signal);
      setTimeout(() => {
        this.ws.publish(`/${peerid}`, {
          from: this.id,
          payload: signal,
        });
      }, 0);
    });

    peer.on("connect", this.onconnect(peer, peerid));
    peer.on("disconnect", this.ondisconnect(peer, peerid));
    // peer.on("data", this.ondata(peerid));
    peer.on("close", this.onclose(peerid));
    peer.on("error", (err) => {
      console.error("peer error", err);
      this.onclose(peerid)();
    });

    peer.on("iceStateChange", (iceConnectionState, iceGatheringState) => {
      console.log("onIceStateChange", iceConnectionState, iceGatheringState);
    });

    peer.on("negotiated", () => console.log("negotiated"));
    peer.on("signalingStateChange", (signalingState) =>
      console.log("signalingStateChange", signalingState)
    );
  }

  process(cb) {
    this.processor = cb;
  }

  // { from: clientid, payload: { type: '______', ... } }
  onsignal(data) {
    const peerid = data.from;

    console.log("onsignal received signal from", peerid);

    if (!this.peers[peerid]) {
      console.log("... still need to peerup with", peerid);
      this.peerup(data, false);
    }

    console.log("signal(", data.payload, ")");
    this.peers[peerid].signal(data.payload);
  }

  onconnect(peer, id) {
    const stream = this.log.replicate({ live: true });
    stream.pipe(peer).pipe(stream);

    stream.on("push", () => {
      this.emit("push", id);
    });

    stream.on("pull", () => {
      this.emit("pull", id);
    });

    return () => {
      this.emit("peer", peer, id);
    };
  }

  ondisconnect(peer, id) {
    return () => {
      this.emit("peer:disconnect", peer, id);
    };
  }

  onclose(id) {
    return () => {
      delete this.peers[id];
      this.emit("close", id);
    };
  }

  startProcessor(log) {
    log.ready(() => {
      if (log.processing) return;

      const rs = (log.processing = log.createReadStream({
        live: true,
      }));

      rs.on("data", (data) => {
        const m = schema.Message.decode(data.value);
        console.log("processor decoded message", m);
        this.emit("message", m);
      });
    });
  }

  // user: { username, uid }
  send(user, val, channel = null) {
    const message = {
      timestamp: Date.now(),
      text: val,
      username: user.username,
      uid: user.uid,
    };

    this.log.heads((err, heads) => {
      if (err) {
        console.error("failed to get heads", err);
        return;
      }

      console.log("saving message", message);
      this.log.add(heads, schema.Message.encode(message), () =>
        console.log("added")
      );
    });
  }

  close() {
    for (const [key, peer] of Object.entries(this.peers)) {
      peer.destroy();
      console.log(`${key}: detroyed`);
    }
  }
}

export { Swarm };
