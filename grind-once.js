var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var player = new WebAudioFontPlayer();
// hard-coded piano for now
let presetname = '_tone_0000_JCLive_sf2_file';
player.loader.decodeAfterLoading(audioContext, presetname);

let queue = [60, 72]

// nextInQueue
let qindex = -1;
function nextInQueue(q) {
  qindex = (qindex + 1) % q.length;
  return q[qindex];
}

function playLongTone(freq) {
  player.queueWaveTable(audioContext, audioContext.destination, _tone_0000_JCLive_sf2_file, 0, freq, 999, 0.2);
}

var gp1 = {}, gp2 = {}, turn = false;
function playGamelanTone(lastEnv, nextFreq) {
  if (typeof lastEnv !== "undefined")
    lastEnv.cancel();
  lastEnv = null;
  return player.queueWaveTable(audioContext, audioContext.destination, _tone_0000_JCLive_sf2_file, 0, nextFreq, 999, 0.2);
}

// triggers payload contents of currently queued event
// stores held notes in grinderobj.voices
// increments index (breaks at end)
let i = 0;
let lookahead = 30;
let onned = false;
function grindOnce(grinderobj, lookahead = false) {
  let ons = 0;
  grinderobj.events[i].payload.forEach((item, index) => {
    if (item.type == "on") {
      ons++;
      grinderobj.voices.push(
        player.queueWaveTable(audioContext,
          audioContext.destination,
          _tone_0000_JCLive_sf2_file, 0,
          // pitch, max duration, amplitude
          item.midi, 999, 0.2));
    }
    if (item.type == "off") {
      let v = grinderobj.voices.findIndex((voice) =>
        voice.pitch == item.midi);
      //console.log(v);
      grinderobj.voices[v].cancel();
      grinderobj.voices.splice(v, 1);
    }
  });

  // is next one soon? then do it, whether or not onned
  // is one after that soon? then do it, etc.
  // look ahead
  if( !lookahead ) { 
    while (
      ((grinderobj.events[i + 1].time - grinderobj.events[i].time) < lookahead)){
        grindOnce(grinderobj, true);

    }
  }
  i++;
  if( !ons ) {
    grindOnce(grinderobj);
  }
}

// keyevent version 1
// uses hardcoded queue array of nn values
function keyevent1(e) {
  document.querySelector('body').
    innerHTML = nextInQueue(queue);
  //pipe.envelope=
  //playLongTone(queue[i]);
  if (turn) {
    gp1.envelope = playGamelanTone(gp2.envelope, queue[qindex]);
  }
  else {
    gp2.envelope = playGamelanTone(gp1.envelope, queue[qindex]);
  }
  turn = !turn;
}