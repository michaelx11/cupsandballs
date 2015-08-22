var Firebase = require('firebase');
var authConfig = require('./authConfig');
var root = new Firebase(authConfig.firebaseURL);
root.auth(authConfig.firebaseSecret);

var crypto = require('crypto');

var one_sixth = 1 / 6.0;
function getRandomSwap() {
  var rand = Math.random();
  var move = '';
  if (rand < one_sixth) {
    move = 'swap12';
  } else if (rand < 2 * one_sixth) {
    move = 'swap13';
  } else if (rand < 3 * one_sixth) {
    move = 'swap23';
  } else if (rand < 4 * one_sixth) {
    move = 'swapleft';
  } else if (rand < 5 * one_sixth) {
    move = 'swapright';
  } else {
    move = 'swapjk';
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
        delete sessionDict[key];
      }
    }
  }
}

// get the maintenance going
setInterval(maintainSessionDict, 1000);

function genSessionKey() {
  return crypto.randomBytes(64).toString('hex');
}

function createSession(session_key, answer, swaps, timestamp, duration) {
  var session = {'level': 0,
                 'key': session_key, 
                 'swaps': swaps,
                 'answer': answer,
                 'timestamp': getTimeMillis(),
                 'duration': duration};
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
  } else if (move == 'swapjk') {
    return temp;
  }
  return pos;
}

// returns {swaps: array of swaps, final: final arrangement}
function genListOfSwaps(len) {
  var pos = ['r', 'g', 'b'];
  var listOfSwaps = [];
  for (var i = 0; i < len; i++) {
    var move = getRandomSwap();
    pos = performSwap(move, pos);
    listOfSwaps.push_back(move);
  }
  return {'swaps':listOfSwaps, 'swaps':pos};
}


function searchForGameSession(sessionId) {
}

var SWAP_DELAY = 50;
function calcDuration(numSwaps) {
  return numSwaps * 8 * SWAP_DELAY + 5000;
}

function initNewSession(level) {
  var session = {};
  var sessionKey = genSessionKey();
  var swapResults = genListOfSwaps(level + 3);
  var swaps = swapResults['swaps'];
  var answer = swapResults['answer'];
  var duration = calcDuration(numSwaps);
  return createSession(sessionKey, answer, swaps, timestamp, duration);
}

exports.initGame = function(cbErrorData) {
  // create and add session
  var session = initNewSession(0);
  sessionDict[session_key] = session;

  // create and return response
  var response = {'key': session_key};
  callback(false, response);
}

exports.guess = function(guess, key, cbErrorData) {
  if (!sessionDict.hasOwnProperty(key)) {
    cbErrorData("Error: game session not found with key: " + key, false);
  } else {
    var session = sessionDict[key];
    delete sessionDict[key];
    if (session.answer[guess] && (session.answer[guess] == session.color)) {
      var newSession = initNewSession(level);
      sessionDict[newSession.key] = newSession;
      var response = {'result': 'right', 'key': newSession['key']};
      cbErrorData(false, response);
    } else {
      var response = {'result': 'wrong'};
      cbErrorData(false, response);
    }
  }
}
