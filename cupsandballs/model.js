var Firebase = require('firebase');
var authConfig = require('./authConfig');
var root = new Firebase(authConfig.firebaseURL);
root.auth(authConfig.firebaseSecret);

var crypto = require('crypto');

var NUM_SWAPS_POSSIBLE = 8;
var prob = 1.0 / 8.0;
function getRandomSwap() {
  var rand = Math.random();
  var move = '';
  if (rand < prob) {
    move = 'swap12';
  } else if (rand < 2 * prob) {
    move = 'swap13';
  } else if (rand < 3 * prob) {
    move = 'swap23';
  } else if (rand < 4 * prob) {
    move = 'swapleft';
  } else if (rand < 5 * prob) {
    move = 'swapright';
  } else if (rand < 6 * prob) {
    move = 'swapfake1';
  } else if (rand < 7 * prob) {
    move = 'swapfake2';
  } else {
    move = 'swapfake3';
  }
  return move;
}

function getTimeMillis() {
  return (new Date()).getTime();
}

// stores open game sessions
// Sessions:
// - session
//    - level
//    - session_key
//    - swaps
//    - answer
//    - timestamp
//    - duration
//    - color // of the ball we want
var sessionDict = {};

function maintainSessionDict() {
  for(var key in sessionDict) {
    if (sessionDict.hasOwnProperty(key)) {
      var session = sessionDict[key];
      if (getTimeMillis() - session.timestamp > session.duration) {
        console.log('deleted baby');
        delete sessionDict[key];
      }
    }
  }
}

// get the maintenance going
setInterval(maintainSessionDict, 1000);

function genSessionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(session_key, answer, swaps, timestamp, duration) {
  return session;
}

function performSwap(move, pos) {
  var temp = [pos[0], pos[1], pos[2]];
  if (move == 'swap12') {
    return [temp[1], temp[0], temp[2]];
  } else if (move == 'swap13') {
    return [temp[2], temp[1], temp[0]];
  } else if (move == 'swap23') {
    return [temp[0], temp[2], temp[1]];
  } else if (move == 'swapleft') {
    return [temp[1], temp[2], temp[0]];
  } else if (move == 'swapright') {
    return [temp[2], temp[0], temp[1]];
  }
  return pos;
}

// returns {swaps: array of swaps, final: final arrangement}
function genListOfSwaps(len) {
  var pos = ['red', 'green', 'blue'];
  var listOfSwaps = [];
  for (var i = 0; i < len; i++) {
    var move = getRandomSwap();
    pos = performSwap(move, pos);
    listOfSwaps.push(move);
  }
  return {'swaps':listOfSwaps, 'answer':pos};
}


function searchForGameSession(sessionId) {
}

function calcDuration(numSwaps, speed) {
  return numSwaps * 8 * speed + 5000;
}

function calcShown(level) {
  var colors = ['red', 'green', 'blue'];
  var index = Math.floor((Math.random() * 3)) + 1;
  if (level < 5) {
    return {'color': colors[index - 1], 'shown':[index]};
  } else if (level < 10) {
    var index2 = Math.floor((Math.random() * 3)) + 1;
    while (index2 == index) {
      index2 = Math.floor((Math.random() * 3)) + 1;
    }
    return {'color': colors[index - 1], 'shown':[index, index2]}
  } else if (level < 15) {
    return {'color': colors[index - 1], 'shown':[1, 2, 3]};
  }
}

function calcSpeed(level) {
  var speed = 100 - level * 8;
  if (speed < 20) {
    speed = 20;
  }
  return speed;
}

function initNewSession(level) {
  var session = {};
  var sessionKey = genSessionKey();
  var numSwaps = level + 3;
  var speed = calcSpeed(level);
  var swapResults = genListOfSwaps(numSwaps);
  var swaps = swapResults['swaps'];
  var answer = swapResults['answer'];
  var duration = calcDuration(numSwaps, speed);
  var shownData = calcShown(level);
  var color = shownData['color'];
  var shown = shownData['shown'];
  if (level >= 5) {
    var rand = Math.random();
    if (rand < .33333) {
      color = 'blue';
    } else if (rand < .666666) {
      color = 'green';
    }
  }
  var session = {'level': level,
                 'key': sessionKey, 
                 'swaps': swaps,
                 'answer': answer,
                 'timestamp': getTimeMillis(),
                 'duration': duration,
                 'color': color,
                 'speed': speed,
                 'shown': shown};
  return session;
}

function createResponseFromSession(session) {
  var response = {'key': session.key};
  response['level'] = session.level;
  response['color'] = session.color;
  response['swaps'] = session.swaps;
  response['shown'] = session.shown;
  response['gamespeed'] = session.speed;
  response['expiry'] = session.duration;
  return response;
}

exports.initGame = function(cbErrorData) {
  // create and add session
  var session = initNewSession(0);
  sessionDict[session.key] = session;

  // create and return response
  var response = createResponseFromSession(session);
  cbErrorData(false, response);
}

exports.guess = function(guess, key, cbErrorData) {
  if (!sessionDict.hasOwnProperty(key)) {
    cbErrorData("Error: game session not found with key: " + key, false);
  } else {
    var session = sessionDict[key];
    delete sessionDict[key];
    if (session.answer[guess] && (session.answer[guess] == session.color)) {
      var level = session.level + 1;
      var newSession = initNewSession(level);
      sessionDict[newSession.key] = newSession;
      var response = createResponseFromSession(newSession);
      cbErrorData(false, response);
    } else {
      var response = {'result': 'wrong', 'level': session.level};
      cbErrorData(false, response);
    }
  }
}
