const dgram = require("dgram");
const readline = require("readline");

const GAME_OVER_STATUSES = ["Client wins", "Computer wins"];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("close", function () {
  console.log("\nBYE BYE !!!");
  process.exit(0);
});

class Sender {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.client = dgram.createSocket("udp4");

    this.init();
  }

  init = async () => {
    this.client.on("message", async (data) => {
      const recievedData = data.toString("utf8");

      console.clear();

      if (recievedData) {
        try {
          console.log('Boards: Computer - Client')
          console.log(JSON.parse(recievedData));
        } catch (e) {
          console.warn(recievedData);
        }
      }

      if (!GAME_OVER_STATUSES.includes(recievedData))
        await this.ask("Your turn: ");
      else rl.close();
    });

    await this.send("ping", 1337, "127.0.0.1", (err) => {
      console.error(err);
    });
  };

  send = async (dataSet) => {
    await this.client.send(
      JSON.stringify(dataSet),
      1337,
      "127.0.0.1",
      (err) => {
        console.error("err", err);
      }
    );
  };

  ask = (question = "Waiting for your command: ") => {
    rl.question(question, async (answer) => {
      const [row, column] = answer.split(" ");

      await this.send({ row, column }, 1337, "127.0.0.1", (err) => {
        console.error(err);
      });
    });
  };
}

new Sender("127.0.0.1", 1337);
