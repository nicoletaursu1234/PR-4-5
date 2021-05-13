const net = require("net");
const crypto = require("crypto");

let serverBoard = [
  [1, 0, 0, 1, 0],
  [0, 0, 0, 1, 0],
  [0, 1, 0, 1, 0],
  [0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
let clientBoard = [
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [0, 0, 1, 0, 1],
  [0, 0, 1, 0, 0],
];

const letterIndexes = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
};
const indexNumber = [0, 0, 1, 2, 3, 4];

let targets = serverBoard
  .map((row, index) =>
    row
      .map((col, colIndex) => {
        if (!col) return +`${index}${colIndex}`;
      })
      .filter((col) => typeof col === "number")
  )
  .flat();

const getTargetIndexes = () => {
  const targteIndex = parseInt(Math.random() * targets.length);
  let indexString =
    targets[targteIndex] % 10 === 0
      ? targets[targteIndex]?.toString().split("").join(".")
      : `${targets[targteIndex] / 10}`;

  if (indexString.length === 1) {
    indexString = `0.${indexString}`;
  }

  targets = targets.filter((indexPair, index) => index !== targteIndex);

  return indexString.split(".").map((num) => +num);
};

const code = crypto.randomBytes(16).toString("hex") + "\n";

const replaceNumbers = (board) =>
  board.map((row) => row.map((col) => (typeof col === "number" ? "~" : col)));

const checkHit = (letter, index, isClient = true) => {
  const boardToCheck = isClient ? serverBoard : clientBoard;

  if ([letter, index].some((itm) => typeof itm === "undefined"))
    return boardToCheck;
  if (isClient && !(letter?.toLowerCase?.() in letterIndexes))
    return boardToCheck;

  const rowIndex = isClient ? letterIndexes[letter.toLowerCase()] : letter;
  const colIndex = !isClient ? index : indexNumber[index] || 0;

  boardToCheck[rowIndex][colIndex] = boardToCheck[rowIndex][colIndex]
    ? "X"
    : "O";

  return boardToCheck || [];
};

const server = net.createServer((socket) => {
  let data = "";

  socket.write(code);

  socket.on("data", (chunk) => {
    data += chunk;
  });

  socket.on("end", () => {
    if (data.toString("utf8").startsWith("ping")) {
      socket.write(code, (err) => {
        if (err) throw err;
      });
      data = "";
    } else {
      const dataSet = data.toString("utf8").split(code);

      if (!dataSet[1]) return;

      const { row, column } = JSON.parse(dataSet[1]);

      const hittedBoard = checkHit(row, column);
      const hittedClientsBoard = checkHit(...getTargetIndexes(), false);
      const isComputerWin = hittedClientsBoard.every(
        (row) => !row.some((col) => col === 1)
      );
      const isClientWin =
        !isComputerWin &&
        hittedBoard.every((row) => !row.some((col) => col === 1));

      if (isComputerWin) socket.write("Computer wins");
      else if (isClientWin) socket.write("Client wins");
      else if (hittedBoard.length)
        socket.write(
          JSON.stringify([
            replaceNumbers(hittedBoard),
            replaceNumbers(hittedClientsBoard),
          ])
        );
      data = "";
    }
  });

  socket.on("error", console.error);
});

server.listen(1337, "127.0.0.1");
