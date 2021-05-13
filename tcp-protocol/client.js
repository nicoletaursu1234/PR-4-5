const net = require('net');
const readline = require('readline');

const GAME_OVER_STATUSES = ['Computer wins', 'Client wins'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("close", function() {
  console.log("\nBYE BYE !!!");
  process.exit(0);
});

class Sender {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.client = new net.Socket();
    this.data = '';
    this.separator = '';

    this.client.on('data', (chunk) => {
      this.data += chunk;
      this.client.end();
    });

    this.client.on('end',   async () => {
      const recievedData = this.data.toString('utf8');

      if (!this.separator) {
        this.separator = recievedData;
        this.data = '';
      }

      console.clear();
      if (recievedData && recievedData !== this.separator) {
        try {
          console.warn(
            JSON.parse(
              recievedData
                .split('\n')[1]
            )
          );
        } catch (e) {
          console.warn(
            recievedData
          );
        }
      }

      if (!GAME_OVER_STATUSES.includes(recievedData.replace(this.separator, ''))) await this.ask('Your turn: ');
      this.client.destroy();

      this.data = '';
    });

    this.init();
  }

  init = async () => {
    await this.send('ping');
  };

  send = async (dataSet) => {
    this.client.connect(this.port, this.host, async () => {
      console.warn(this.separator);
      await this.client.write(`${this.separator}${JSON.stringify(dataSet)}`);
    });
  }

  ask = (question = 'Waiting for your command: ') => {
    rl.question(question, async (answer) => {
      const [row, column] = answer.split(' ');

      await this.send({ row, column });
    });
  };
}

new Sender('127.0.0.1', 1337);
