// Initialize Firebase
  var config = {
    apiKey: "AIzaSyAYc6J1i89-emgv4HztlrTKEp2BfTRUGsE",
    authDomain: "collaborative-sketch-4cea4.firebaseapp.com",
    databaseURL: "https://collaborative-sketch-4cea4.firebaseio.com",
    projectId: "collaborative-sketch-4cea4",
    storageBucket: "collaborative-sketch-4cea4.appspot.com",
    messagingSenderId: "148851247978"
  };
  firebase.initializeApp(config);

  var data = firebase.database().ref();
  var points = [];
  var backgroundColor = "white"

function setup() {
  var canvas = createCanvas(window.innerWidth, window.innerHeight);
  background(backgroundColor);
  setTextColor();
  fill(0);

  data.on("child_added", function (entry) {
    if (entry.val().type == 'point') {
      points.push(entry.val());
    }
    else if(entry.val().type == 'color') {
      backgroundColor = entry.val().color;
      setTextColor();
    }
  });

  data.on("child_removed", function (point) {
    points = [];
    backgroundColor = "white";
    setTextColor();
  });

  canvas.mousePressed(drawPoint);
  canvas.mouseMoved(drawPointIfMousePressed);
  canvas.mouseReleased(addBlankPoint);

  canvas.touchStarted(hideMobileText);
}

function draw() {
  background(backgroundColor);

  for (var i = 1; i < points.length; i++) {
    var oldPoint = points[i - 1];
    var newPoint = points[i];
    if (oldPoint.x && oldPoint.y && newPoint.x && newPoint.y) {
      line(oldPoint.x, oldPoint.y, newPoint.x, newPoint.y);
    }
    if (newPoint.last) ellipse(newPoint.x, newPoint.y, 1, 1);
  }
}

function drawPoint() {
  console.log(1423);
  data.push({type: 'point'});
  data.push({type: 'point', x: mouseX, y: mouseY});
}

function drawPointIfMousePressed() {
  if (mouseIsPressed) {
    data.push({type: 'point', x: mouseX, y: mouseY});    
  }
}

function addBlankPoint() {
  data.push({type: 'point', last: true, x: mouseX, y: mouseY});
  data.push({type: 'point'});
}

function clearDrawing() {
  data.remove();
  points = [];
  backgroundColor = 'white';
}

function hideMobileText() {
  document.getElementById('mobile-container').style.display = 'none';
}

function setTextColor() {
  let el = document.createElement('div');
  el.style.backgroundColor = backgroundColor;
  let container = document.getElementById('container');
  container.appendChild(el);
  let [r, g, b] = getComputedStyle(el).backgroundColor.slice(4, -1).split(', ');
  let textColor = (r*0.299 + g*0.587 + b*0.114) > 186 ? 'black' : 'white';
  document.body.style.color = textColor;
}

document.getElementById('url').innerText = location.href;
