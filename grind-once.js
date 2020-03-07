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
// increments index (loops to beginning)
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
        if( v > -1)
        {
          grinderobj.voices[v].cancel();
          grinderobj.voices.splice(v, 1);
        }
    }
  });

  // increment and modulo
  i = (i+1) % grinderobj.events.length;

  // is next one soon? then do it, whether or not onned
  // is one after that soon? then do it, etc.
  // look ahead
  if( i != 0 && !lookahead ) { 
    while (
      ((grinderobj.events[i].time - grinderobj.events[i-1].time) < lookahead)){
        grindOnce(grinderobj, true);

    }
  }

  // this little bit here ensures that every keystroke triggers at least to the next note-on
  if( !ons && i != 0) {
    grindOnce(grinderobj);
  }
}

function backwardGrind(grinderobj) {
  // off the notes
  grinderobj.events[i].payload.forEach((item, index) => {
    if (item.type == "on") {
      // don't go on yet!
      return;
    }
    if (item.type == "off") {
      let v = grinderobj.voices.findIndex((voice) =>
        voice.pitch == item.midi);
      if( v > -1)
      {
        grinderobj.voices[v].cancel();
        grinderobj.voices.splice(v, 1);
      }
    }
  });
  i = lookBehind(grinderobj, i);
  grindOnce(grinderobj);
}

function lookBehind(grinderobj, ig) {
    ig--;
    while( ig > 0)
    {
      ig--;
      if( grinderobj.events[ig].payload.findIndex((item) =>
        item.type == "on") > -1) {
          return ig;
        }
    }
    ig = grinderobj.events.length - 1;
    return lookBehind(grinderobj, ig);
}

function regrind(grinderobj) {
  // off the notes
  grinderobj.events[i].payload.forEach((item, index) => {
    if (item.type == "on") {
      // don't go on yet!
      return;
    }
    if (item.type == "off") {
      let v = grinderobj.voices.findIndex((voice) =>
        voice.pitch == item.midi);
      if( v > -1)
        {
          grinderobj.voices[v].cancel();
          grinderobj.voices.splice(v, 1);
        }
      }
  });
  i = (i-1) % grinderobj.events.length;
  grindOnce(grinderobj);
}

function jumpAndGrind(grinderobj, new_i) {
  allOff(grinderobj);
  i = new_i;
  grindOnce(grinderobj);
}

let arp = -1;
let pitches;
function arpeggiate(grinderobj) {
  // going from full chord to voices; harvest the pitches
  if(arp == -1)
  { 
    pitches = [];
    grinderobj.voices.forEach((item, index) => {
      pitches.push(item.pitch);
    });
  }
  arp++;
  console.log(arp);
  // after arpeggiating thru all, replay full chord & reset pitch memory
  if(arp == pitches.length)
  {
    arp = -1;
    pitches = [];
    regrind(grinderobj);
    return;
  }
  // turn off previous voice(s)
  allOff(grinderobj);
  // turn on this voice
  grinderobj.voices.push(
    player.queueWaveTable(audioContext,
      audioContext.destination,
      _tone_0000_JCLive_sf2_file, 0,
      // pitch, max duration, amplitude
      pitches[arp], 999, 0.2));
}

function allOff(grinderobj) {
  grinderobj.voices.forEach((item, index) => {
    item.cancel();
  });
  grinderobj.voices = [];
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