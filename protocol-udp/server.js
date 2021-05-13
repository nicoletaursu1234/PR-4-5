const dgram = require('dgram');

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
  .map((row, index) => row
    .map((col, colIndex) => {
      if (!col) return +`${index}${colIndex}`;
    })
    .filter(col => typeof col === 'number')
  )
    .flat();

const getTargetIndexes = () => {
  const targteIndex = parseInt(Math.random() * targets.length);
  let indexString = targets[targteIndex] % 10 === 0 ? targets[targteIndex]?.toString().split('').join('.') : `${targets[targteIndex] / 10}`;

  if (indexString.length === 1) {
    indexString = `0.${indexString}`;
  }

  targets = targets.filter((indexPair, index) => index !== targteIndex);

  return indexString.split('.').map(num => +num);
};

const replaceNumbers = (board) => board.map(row => row.map(col => typeof col === 'number' ? '~' : col));

const errorHandler = (error) => error && console.trace(error);

const checkHit = (letter, index, isClient = true) => {
  const boardToCheck = isClient ? serverBoard : clientBoard;

  if ([letter, index].some(itm => typeof itm === 'undefined')) return boardToCheck;
  if (isClient && !(letter?.toLowerCase?.() in letterIndexes)) return boardToCheck;

  const rowIndex = isClient ? letterIndexes[letter.toLowerCase()] : letter;
  const colIndex = !isClient ? index : indexNumber[index] || 0;

  boardToCheck[rowIndex][colIndex] = boardToCheck[rowIndex][colIndex] ? 'X' : 'O';

  return boardToCheck || [];
};

const server = dgram.createSocket('udp4');

const send = (msg, port = 1337) => server.send(msg, port, '127.0.0.1', errorHandler);

server.on('message', (data, info) => {
  if (data.toString('utf8').startsWith('"ping"')) {
    send(JSON.stringify([replaceNumbers(serverBoard), replaceNumbers(clientBoard)]), info.port);
  } else {
    const dataSet = data.toString('utf8');

    if (!dataSet[1]) return;

    const { row, column } = JSON.parse(dataSet);

    const hittedBoard = checkHit(row, column);
    const hittedClientsBoard = checkHit(...getTargetIndexes(), false);
    const isComputerWin = hittedClientsBoard.every(row => !row.some(col => col === 1));
    const isClientWin = !isComputerWin && hittedBoard.every(row => !row.some(col => col === 1));

    console.log({ row, column });

    if (isComputerWin) send('Computer wins', info.port);
    else if (isClientWin) send('Client wins', info.port);
    else if (hittedBoard.length) send(JSON.stringify([replaceNumbers(hittedBoard), replaceNumbers(hittedClientsBoard)]), info.port);
  }
});

server.on('error', (err) => console.error('Error appeared because of:', err));

server.bind(1337, '127.0.0.1');
