// oh lawd, i hope i don't have to write my own WebRTC stack

import EventEmitter from "eventemitter3";

export const JOIN_CALL = "JOIN_CALL";
export const EXCHANGE = "EXCHANGE";
export const LEAVE_CALL = "LEAVE_CALL";

// RTCConfiguration
export const ice = {
  iceTransportPolicy: "relay",
  iceServers: [
    { urls: "stun.l.google.com:19302" },
    { urls: "stun1.l.google.com:19302" },
    { urls: "stun2.l.google.com:19302" },
    { urls: "stun3.l.google.com:19302" },
    { urls: "stun4.l.google.com:19302" },
  ],
};

/* eslint-disable no-console */

// based on https://blog.usejournal.com/videochat-in-under-30-a-rails-react-tutorial-534930c6cd96

const broadcastData = (channel, data) => {
  // websocket
  channel.send(data);
};

export const VideoEvents = new EventEmitter();

const getConstraints = () => {
  // MediaStreamConstraints
  return {
    audio: false,
    video: false,
    // {
    //   width: {
    //     min: 240,
    //     max: 320,
    //   },
    //   height: {
    //     min: 0,
    //     max: 300,
    //   },
    //   frameRate: {
    //     min: 2,
    //     max: 18,
    //   },
    // },
  };
};

/*
VideoContainerProps {
  path: string
  videoEvents: EventEmitter
  asConnector: string
}
*/

export class DataChannels extends EventEmitter {
  constructor(ws, id) {
    super();

    this.ws = ws;
    this.peers = {};

    ws.subscribe("/swarm", this.onmember.bind(this));
    ws.subscribe(`/${id}`, this.onmessage.bind(this));
  }

  onmember({ from, type })

  createPeerConnection(otherid, initiator) {
    const pc = new RTCPeerConnection(ice);
    this.peers[otherid] = pc;

    const send = (message) => {
      this.ws.publish(`/${otherid}`, { from: this.id, message });
    };

    if (initiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer).then(() => {
          setTimeout(() => {
            send({
              type: EXCHANGE,
              sdp: JSON.stringify(pc.localDescription),
            });
          }, 0);
        });
      });
    }

    pc.onicecandidate = (e) => {
      if (console) console.log("asconnector", "pc.onicecandidate");
      send({
        type: EXCHANGE,
        sdp: JSON.stringify(e.candidate),
      });
    };

    pc.ontrack = (e) => {
      if (console) console.log("asconnector", "pc.ontrack");
    };

    pc.oniceconnectionstatechange = () => {
      console.log(
        `/${otherid}`,
        "pc.oniceconnectionstatechange",
        pc.iceConnectionState
      );

      if (pc.iceConnectionState === "disconnected") {
        send({ type: LEAVE_CALL });
      }
    };

    return pc;
  }

  // any
  doExchange(data) {
    let pc = null; // : RTCPeerConnection | null

    if (this.peers[data.from]) {
      pc = this.peers.current[data.from];
    } else {
      pc = this.createPc(data.from, false);
    }

    if (pc === null) {
      console.log("unable to create peer connection :(");
      return;
    }

    if (data.candidate) {
      const candidate = JSON.parse(data.candidate);
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

    if (data.sdp) {
      const sdp = JSON.parse(data.sdp);
      if (sdp && !sdp.candidate) {
        pc.setRemoteDescription(sdp).then(() => {
          if (sdp.type === "offer") {
            if (pc === null) return;
            pc.createAnswer().then((answer) => {
              if (pc === null) return;
              pc.setLocalDescription(answer).then(() => {
                if (pc === null) return;
                broadcastData(props.path, {
                  type: EXCHANGE,
                  to: data.from,
                  sdp: JSON.stringify(pc.localDescription),
                });
              });
            });
          }
        });
      }
    }
  }
}

export const usePeer = ({ channel, events }) => {
  // const [localStream, setLocalStream] = useState(null); // MediaStream
  const pcPeers = useRef({}); // Record<string, RTCPeerConnection>

  const createPc = useCallback((userId, offerBool) => {
    // string, boolean
    // if (localStream) {
    const pc = new RTCPeerConnection(ice);
    pcPeers.current[userId] = pc;

    // connect local video stream to outbound peer connection
    // localStream
    //   .getTracks()
    //   .forEach((track) => pc.addTrack(track, localStream))

    if (offerBool) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer).then(() => {
          setTimeout(() => {
            channel.send({
              type: EXCHANGE,
              sdp: JSON.stringify(pc.localDescription),
            });
            // broadcastData(props.path, {
            // type: EXCHANGE,
            // to: userId,
            // sdp: JSON.stringify(pc.localDescription),
            // });
          }, 0);
        });
      });
    }

    pc.onicecandidate = (e) => {
      if (console) console.log("asconnector", "pc.onicecandidate");
      channel.send({
        type: EXCHANGE,
        sdp: JSON.stringify(e.candidate),
      });
      // broadcastData(props.path, {
      //   type: EXCHANGE,
      //   to: userId,
      //   sdp: JSON.stringify(e.candidate),
      // });
    };

    pc.ontrack = (e) => {
      if (console) console.log("asconnector", "pc.ontrack");
      // if (remoteVidRef.current) {
      //   const [stream] = e.streams;
      //   remoteVidRef.current.srcObject = stream;
      //   try {
      //     const [sender] = pc.getSenders();
      //     const params = sender.getParameters();
      //     if (!(params.encodings && params.encodings[0])) {
      //       params.encodings = [{}]; // Firefox workaround!
      //     }
      //     params.encodings[0].maxBitrate = 250000;
      //   } catch (ex) {
      //     console.error("ERROR: failed to downscale connection", ex);
      //     if (console)
      //       console.log("ERROR: failed to downscale connection", ex);
      //   }
      // }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(
        channel.path,
        "pc.oniceconnectionstatechange",
        pc.iceConnectionState
      );
      if (pc.iceConnectionState === "disconnected") {
        channel.send({ type: LEAVE_CALL });
        // broadcastData(props.path, { type: LEAVE_CALL });
      }
    };

    return pc;
  }, []);

  const doExchange = useCallback(
    (data: any) => {
      let pc = null; // : RTCPeerConnection | null

      if (pcPeers.current[data.from]) {
        pc = pcPeers.current[data.from];
      } else {
        pc = createPc(data.from, false);
      }
      if (pc === null) return;

      if (data.candidate) {
        const candidate = JSON.parse(data.candidate);
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }

      if (data.sdp) {
        const sdp = JSON.parse(data.sdp);
        if (sdp && !sdp.candidate) {
          pc.setRemoteDescription(sdp).then(() => {
            if (sdp.type === "offer") {
              if (pc === null) return;
              pc.createAnswer().then((answer) => {
                if (pc === null) return;
                pc.setLocalDescription(answer).then(() => {
                  if (pc === null) return;
                  broadcastData(props.path, {
                    type: EXCHANGE,
                    to: data.from,
                    sdp: JSON.stringify(pc.localDescription),
                  });
                });
              });
            }
          });
        }
      }
    },
    [createPc]
  );

  const leaveCall = useCallback(() => {
    const pcKeys = Object.keys(pcPeers.current);
    for (let i = 0; i < pcKeys.length; i += 1) {
      pcPeers.current[pcKeys[i]].close();
    }
    pcPeers.current = {};

    // if (localVidRef.current) {
    //   localVidRef.current.srcObject.getTracks().forEach((track) => {
    //     track.stop();
    //   });
    //   localVidRef.current.srcObject = null;
    // }

    // if (remoteVidRef.current) remoteVidRef.current.innerHTML = "";

    broadcastData(props.path, { type: LEAVE_CALL });
  }, []);

  useEffect(() => {
    props.videoEvents.on(JOIN_CALL, (data) => {
      // if (console)
      //   console.log(
      //     '[VideoContainer events] join',
      //     data,
      //     'creating peer connection!'
      //   )
      createPc(data.from, true);
    });

    props.videoEvents.on(EXCHANGE, (data) => {
      // if (console)
      //   console.log(
      //     '[VideoContainer events] a participant requests exchange',
      //     data
      //   )
      doExchange(data);
    });

    props.videoEvents.on(LEAVE_CALL, (data) => {
      // if (console)
      //   console.log("[VideoContainer events] a participant has left", data);
      // if (remoteVidRef.current) remoteVidRef.current.srcObject = null;
      delete pcPeers.current[data.from];
    });

    return () => {
      props.videoEvents.removeAllListeners();
    };
  }, [createPc, doExchange]);

  useEffect(() => {
    if (localVidRef.current) {
      if (
        window.navigator &&
        window.navigator.mediaDevices &&
        window.navigator.mediaDevices.getUserMedia
      ) {
        window.navigator.mediaDevices
          .getUserMedia(getConstraints())
          .then((stream) => {
            setLocalStream(stream);
          })
          .catch((error) => {
            if (console)
              console.log("ERROR: failed to set local stream", error);
            console.error("failed to set local stream", error);
          });
      }
    }
  }, [localVidRef.current]);

  useEffect(() => {
    if (localStream && localVidRef.current) {
      localVidRef.current.srcObject = localStream;
    }

    return () => {
      if (localStream && localVidRef.current) {
        broadcastData(props.path, { type: LEAVE_CALL });
      }
    };
  }, [localStream, localVidRef.current]);

  const joinCall = useCallback(() => {
    broadcastData(props.path, { type: JOIN_CALL });
  }, []);
};
