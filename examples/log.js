const hyperlog = require("hyperlog");
const leveldown = require("leveldown");
const memdown = require("memdown");
const levelup = require("levelup");
const subleveldown = require("subleveldown");
const protobuf = require("protocol-buffers");
const through = require("through2");

const schema = protobuf(`
  message Message {
    optional string username = 1;
    optional string channel = 2;
    optional uint64 timestamp = 3;
    optional string text = 4;
  }
`);

// const dba = levelup(leveldown("./dba.data"));
// const dbb = levelup(leveldown("./dbb.data"));
const dba = levelup(memdown());
const dbb = levelup(memdown());

// dba
//   .createReadStream()
//   .on("data a", function (data) {
//     console.log(data.key, "=", data.value);
//   })
//   .on("end", function () {
//     console.log("a end");
//   });
//
// dbb
//   .createReadStream()
//   .on("data b", function (data) {
//     console.log(data.key, "=", data.value);
//   })
//   .on("end", function () {
//     console.log("b end");
//   });
const log = hyperlog(subleveldown(dba, "swarm"));
const clone = hyperlog(subleveldown(dbb, "swarm"));

class Client {
  constructor(username, db, log) {
    this.username = username;
    this.messages = [];
    this.log = log;
    this.changesOffset = log.changes;
    this.counts = {
      push: 0,
      pull: 0,
    };
  }

  encode(message) {
    return schema.Message.encode({
      username: this.username,
      channel: "sample",
      text: message,
      timestamp: Date.now(),
    });
  }

  replicationStream() {
    return this.log.replicate({ live: true });
  }

  replicate(peer) {
    const stream = this.replicationStream();
    // const right = other.log.replicate({ mode: "sync", live: true });

    stream.on("push", () => {
      this.counts.push++;
      console.log("push", this.username);
    });

    stream.on("pull", () => {
      this.counts.pull++;
      console.log("pull", this.username);
    });

    stream.pipe(peer).pipe(stream);
  }

  process(fn) {
    this.log.ready(() => {
      if (this.processing) return;

      this.processing = this.log.createReadStream({ live: true });

      this.processing.pipe(
        through.obj((data, encode, cb) => {
          let msg = data.value;

          try {
            msg = schema.Message.decode(data.value);
            console.log(
              "%s change: (%d) %s",
              this.username,
              data.change,
              data.key
              // msg
            );
            fn(msg, cb);
            // this.messages.push(msg);
          } catch (ex) {
            console.error("----> failed to decode", msg.toString(), ex.message);
          }
        })
      );
    });
  }

  send(message) {
    return new Promise((resolve) => {
      const m = this.encode(message);
      // this.messages.push(schema.Message.decode(m));
      this.log.heads((err, heads) => {
        this.log.add(heads, m, resolve);
      });
    });
  }
}

const a = new Client("a", dba, log);
const b = new Client("b", dbb, clone);

a.replicate(b.replicationStream());

b.process((message, cb) => {
  console.log("< b got", message);
  b.messages.push(message);

  cb();
});

a.process((message, cb) => {
  console.log("< a got", message);
  a.messages.push(message);

  cb();
});

function start() {
  setTimeout(async () => {
    await a.send("hello");
    console.log("> a sent");
  }, 1);

  setTimeout(async () => {
    await b.send("greetings");
    console.log("> b sent");
  }, 50);

  setTimeout(() => {
    console.log("a", a.messages);
    console.log("b", b.messages);
  }, 100);
}

start();

// const sync = function (a, b) {
//   a = a.createReplicationStream({ mode: "sync", live: true });
//   b = b.createReplicationStream({ mode: "sync", live: true });

//   a.on("push", function () {
//     console.log("a pushed");
//   });

//   a.on("pull", function () {
//     console.log("a pulled");
//   });

//   a.on("end", function () {
//     console.log("a ended");
//   });

//   b.on("push", function () {
//     console.log("b pushed");
//   });

//   b.on("pull", function () {
//     console.log("b pulled");
//   });

//   b.on("end", function () {
//     console.log("b ended");
//   });

//   a.pipe(b).pipe(a);
// };

// clone.createReadStream({ live: true }).on("data", function (data) {
//   let msg = data.value;
//   try {
//     msg = schema.Message.decode(data.value);
//   } catch (ex) {
//     console.error("----> failed to decode", msg.toString());
//   }
//   console.log("change: (%d) %s", data.change, data.key, msg);
// });
// sync(log, clone);

// function msg(un, value) {
//   return schema.Message.encode({
//     username: un,
//     channel: "sample",
//     text: value,
//     timestamp: Date.now(),
//   });
// }

// console.log('add null "hello"');
// log.add(null, msg("a", "hello"), function (err, node) {
//   if (err) throw err;

//   // log.heads((err, heads) => {
//   //   console.log('a heads', heads)
//   // })

//   log.add(node, msg("a", "world"), function (err, node) {
//     if (err) throw err;

//     log.add(null, msg("a", "meh"), function (err) {
//       if (err) throw err;

//       clone.heads((err, heads) => {
//         heads.forEach((head) => {
//           console.log("clone head", schema.Message.decode(head.value));
//         });
//       });
//     });
//   });
// });

// setTimeout(() => {
//   log.add(null, msg("a", "spam"));
// }, 200);
