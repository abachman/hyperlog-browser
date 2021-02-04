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
    optional string text = 2;
  }
`);

class Client {
  constructor(username, log) {
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
      text: message,
    });
  }

  replicationStream() {
    return this.log.replicate({ live: true });
  }

  replicate(peer) {
    const stream = this.replicationStream();

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
      this.log.heads((_err, heads) => {
        this.log.add(heads, m, resolve);
      });
    });
  }
}

const db = levelup(memdown());

const la = hyperlog(subleveldown(db, "loga"));
const lb = hyperlog(subleveldown(db, "logb"));
const lc = hyperlog(subleveldown(db, "logc"));
const ld = hyperlog(subleveldown(db, "logd"));

const a = new Client("a", la);
const b = new Client("b", lb);
const c = new Client("c", lc);
const d = new Client("d", ld);

a.replicate(b.replicationStream());
a.replicate(c.replicationStream());
a.replicate(d.replicationStream());

a.process((message, cb) => a.messages.push(message) && cb());
b.process((message, cb) => b.messages.push(message) && cb());
c.process((message, cb) => c.messages.push(message) && cb());
d.process((message, cb) => d.messages.push(message) && cb());

async function delayed(cb, to) {
  return new Promise((resolve) => {
    setTimeout(() => {
      cb();
      resolve();
    }, to);
  });
}

async function start() {
  await delayed(async () => {
    await a.send("a:1");
    console.log("> a sent");
  }, 1000);

  await delayed(async () => {
    await b.send("b:1");
    console.log("> b sent");
  }, 1000);

  await delayed(async () => {
    await a.send("a:2");
    console.log("> a sent");
  }, 1000);

  await delayed(async () => {
    await a.send("a:3");
    console.log("> a sent");
  }, 1000);

  await delayed(async () => {
    await c.send("c:1");
    console.log("> c sent");
  }, 1000);

  await delayed(() => {
    console.log("-------------------------------");
    console.log("a", a.messages);
    console.log("-------------------------------");
    console.log("b", b.messages);
    console.log("-------------------------------");
    console.log("c", c.messages);
    console.log("-------------------------------");
    console.log("d", d.messages);
  }, 1000);
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
