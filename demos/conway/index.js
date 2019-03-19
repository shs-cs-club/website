window.mdc.autoInit();

let canvasSize = ((window.innerWidth > window.innerHeight)? window.innerHeight - 80: window.innerWidth) * 0.9;
let can = document.getElementById('canvas');
can.width = can.height = canvasSize;
let ctx = canvas.getContext('2d');

let interval;

let shapes = {
  'Eraser 1x1': '0',
  'Eraser 5x5': '00000,00000,00000,00000,00000',
  'Eraser 10x10': ('0'.repeat(10) + ',').repeat(10).slice(0, -1),
  'Point 1x1': '1', 
  'Blinker 3x3': '000,111,000',
  'Glider 3x3': '001,101,011',
  'Pulsar 13x13': '0011100011100,0000000000000,1000010100001,1000010100001,1000010100001,0011100011100,0000000000000,0011100011100,1000010100001,1000010100001,1000010100001,0000000000000,0011100011100',
  'Pentadecathlon 9x16': '000000000,000000000,000111000,000010000,000010000,000111000,000000000,000111000,000111000,000000000,000111000,000010000,000010000,000111000,000000000,000000000',
  'Lightweight Spaceship 5x4': '01001,10000,10001,11110',
  'Schick Engine 20x11': '01001000000000000000,10000000000000000000,10001000000000000000,11110000000001100000,00000011100000110000,00000011011000000111,00000011100000110000,11110000000001100000,10001000000000000000,10000000000000000000,01001000000000000000',
  'Hivenudger 13x13': '1111000001001,1000100010000,1000000010001,0100100011110,0000000000000,0000011000000,0000011000000,0000011000000,0000000000000,0100100011110,1000000010001,1000100010000,1111000001001',
  'Gosper Glider Gun 36x9': '000000000000000000000000100000000000,000000000000000000000010100000000000,000000000000110000001100000000000011,000000000001000100001100000000000011,110000000010000010001100000000000000,110000000010001011000010100000000000,000000000010000010000000100000000000,000000000001000100000000000000000000,000000000000110000000000000000000000',
  'Random #1 5x4': '00100,01010,10001,01010'
};

let state = {
  shape: 'Point 1x1',
  probability: 10, // 10%
  rotate: 0, // 0 - 0°, 1 - 90°, 2 - 180°, 3 - 270°
  running: false,
  set generation(value) {
    this._generation = value;
    document.getElementById('generation').innerHTML = value;
  },
  get generation() {return this._generation},
  set size(value) {
    this._size = value;
    document.getElementById('apply-x').max = value;
    document.getElementById('apply-y').max = value;
    blank();
  },
  get size() {return this._size},
  set speed(value) {
    this._speed = value;
    if(this.running) {
      clearInterval(interval);
      start();
    }
  },
  get speed() {return this._speed},
  set initial(matrix) {
    this._initial = matrix;
    document.getElementById('start').innerHTML = "Start";
    clearInterval(interval);
    this.running = false;
    this.generation = 0;
    drawLines(ctx);
    this.current = matrix;
    document.getElementById('initial-matrix').value = matrixToString(matrix);
  },
  get initial() {return this._initial},
  set current(matrix) {
    drawMatrix(ctx, matrix, this._current);
    this._current = matrix;
  },
  get current() {return this._current}
};
state.generation = 0;
state.size = 100;
state.speed = 600;
state.initial = generateMatrix(state.size, state.size);

function generateMatrix(rows, columns) {
  [rows, columns] = [parseInt(rows), parseInt(columns)];
  return '0'.repeat(rows).split('').map(
    () => '0'.repeat(columns).split('').map(Number)
  );
}

function duplicateMatrix(matrix) {
  return matrix.map(arr => arr.map(val => val));
}

function rotate(matrix , amount = 1) {
  if (!Array.isArray(matrix)) matrix = stringToMatrix(matrix);
  if (amount === 0) return matrix;
  let newMatrix = generateMatrix(matrix[0].length, matrix.length);
  matrix.forEach((arr, i) => {
    arr = generateMatrix(arr.length, 1).map((a, y) => a.map(() => arr[y]));
    newMatrix = apply(newMatrix, arr, [matrix.length - i - 1, 0]);
  });
  return rotate(newMatrix, amount - 1);
}

function getValue(matrix, position) {
  let [x, y] = position;
  if (x < 0 || y < 0 || x >= matrix[0].length || y >= matrix.length) {
    return 0;
  }
  return matrix[y][x];
}

// direction: 0 - north, 1 - northeast, 2 - east, 3 - southeast,
//            4 - south, 5 - southwest, 6 - west, 7 - northwest
function move(position, direction) {
  let [x, y] = position;
  if(direction % 4) { // not 0 or 4
    x += (direction < 4)? 1 : -1;
  }
  if((direction - 2) % 4) { // not 2 or 6
    y += (direction > 2 && direction < 6)? 1 : -1;
  }
  return [x, y];
}

function getNumAdjacent(matrix, position, type) {
  let count = 0;
  '01234567'.split('').forEach(direction => {
    let value = getValue(matrix, move(position, direction));
    if ((type === undefined && value !== 0) || value === type) {
      count++;
    }
  });
  return count;
}

function step(matrix) {
  let newMatrix = duplicateMatrix(matrix);
  matrix.forEach((arr, y) => {
    arr.forEach((value, x) => {
      if (value === 0) { // empty
        if (getNumAdjacent(matrix, [x, y], 1) == 3) { // 3 adjacent cells
          newMatrix[y][x] = 1; // new cell at this spot
        }
      }
      else if (value == 1) { // cell
        let normalAdjacent = getNumAdjacent(matrix, [x, y], 1);
        if (normalAdjacent < 2 || normalAdjacent > 3) { //underpopulation or overpopulation
          newMatrix[y][x] = 0; // cell dies
        }
      }
    });
  });
  return newMatrix;
}

function drawLines(ctx) {
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  let blockSize = canvasSize / state.size;
  for (let i = 0; i < canvasSize; i += blockSize) {
    //vertical lines 
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvasSize);
    ctx.stroke();
    // horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvasSize, i)
    ctx.stroke();
  }
  let blankMatrix = generateMatrix(state.size, state.size);
  state.current = blankMatrix;
  drawMatrix(ctx, blankMatrix);
}

function drawMatrix(ctx, matrix, oldMatrix) {
  let size = canvasSize / state.size;
  matrix.forEach((arr, y) => {
    arr.forEach((value, x) => {
      if(!oldMatrix || value !== oldMatrix[y][x]) {
        ctx.fillStyle = value? '#000' : '#FFF';
        ctx.fillRect(x * size, y * size, size, size);
      }
    });
  });
}

function setRandom(matrix) {
  return matrix.map(arr => arr.map(() => 
    (Math.random() < state.probability / 100)? 1 : 0
  ));
}

function matrixToString(matrix) {
  return matrix.map(arr => arr.join('')).join(',');
}

function stringToMatrix(str) {
  return str.split(',').map(arr => arr.split('').map(Number));
}

function apply(matrix, shape, position) {
  let newMatrix = duplicateMatrix(matrix);
  shape = Array.isArray(shape)? shape : stringToMatrix(shape);
  let [pX, pY] = position;
  shape.forEach((arr, y)  => {
    arr.forEach((value, x) => {
      if(newMatrix[pY + y] !== undefined && newMatrix[pY + y][pX + x] !== undefined) {
        newMatrix[pY + y][pX + x] = value;
      }
    });
  });
  return newMatrix;
}

function start() {
  interval = setInterval(() => {
    state.current = step(state.current);
    state.generation++;
  }, 60 * 1000 / state.speed);
}

function blank() {
  state.initial = generateMatrix(state.size, state.size);
}

function probabilityChange(element) {
  if (element.checkValidity()) {
    state.probability = parseInt(element.value);
  }
}

function sizeChange(element) {
  if (element.checkValidity()) {
    state.size = parseInt(element.value);
  }
}

function speedChange(element) {
  if (element.checkValidity()) {
    state.speed = parseInt(element.value);
  }
}

function clickRandom() {
  state.initial = setRandom(state.initial);
}

const shapeSelect = document.getElementById('shape-select').MDCSelect;
shapeSelect.listen('MDCSelect:change', () => {
  if (shapes[shapeSelect.value]) {
    state.shape = shapeSelect.value;
  }
});

const degreeSelect = document.getElementById('degree-select').MDCSelect;
degreeSelect.listen('MDCSelect:change', () => {
  state.rotate = degreeSelect.selectedIndex;
})

function canvasClick(e, element) {
  let [relX, relY] = [e.clientX - element.offsetLeft, e.clientY - element.offsetTop];
  let [w, h] = [element.width / state.size, element.height / state.size];
  let position = [Math.floor(relX / w), Math.floor(relY / h)];
  let shape = rotate(shapes[state.shape], state.rotate);
  state.initial = apply(state.initial, shape, position);
}

function startPausePlay(element) {
  if (state.running) { // running
    state.running = false;
    element.innerHTML = 'Resume';
    clearInterval(interval);
  } else { // not started or paused
    state.running = true;
    element.innerHTML = 'Pause';
    start();
  }
}

function nextGeneration() {
  state.current = step(state.current);
  state.generation++;
}

function reset() {
  state.initial = state.initial
}

function copyInitialMatrix() {
  document.getElementById('initial-matrix').select();
  document.execCommand('copy');
}

function applyShape() {
  let shape = document.getElementById('initial-matrix').value.trim();
  let position = [document.getElementById('apply-x').value, document.getElementById('apply-y').value].map(Number);
  state.initial = apply(state.initial, shape, position);
}

function convertToCustom(str) {
  let lines = str.split('\n');
  let max = 0;
  lines.forEach(line => max = (line.length > max)? line.length : max);
  lines = lines.map(line => {
    if(line.length < max) {
      return line + '.'.repeat(max - line.length);
    }
    return line;
  });
  return lines.join(',').replace(/O/g, '1').replace(/\./g, '0');
}

function keyDown(e) {
  var startFunction = function() {
    e.preventDefault();
    startPausePlay(document.getElementById('start'));
  }
  var functions = {
    '49': blank, // '1'
    '50': clickRandom, // '2'
    '51': nextGeneration, // '3'
    '52': reset, // '4'
    '53': startFunction, // '5'
    '67': blank, // 'c'
    '82': clickRandom, // 'r',
    '78': nextGeneration, // 'n',
    '39': nextGeneration, // right arrow key,
    '37': reset, // left arrow key,
    '83': startFunction, // 's'
    '80': startFunction, // 'p'
    '32': startFunction, // ' '
  }
  if (functions[e.which + '']) {
    functions[e.which + '']();
  }
}

// to prevent key presses in input elements from propagating to body
document.querySelectorAll('input').forEach(element => {
  element.onkeydown = e => e.stopPropagation();
});

