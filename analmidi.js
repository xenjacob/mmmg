//future feature: option: round closely-timed objects to same event

// place event with its co-timed events if
// they exist, otherwise schedule new event
// modifies grinderobj
function place(grinderobj, newevent, time) {
  let found = grinderobj['events'].findIndex( (event) =>
    event.time == time);
  if( found < 0) {
    grinderobj['events'].push({
      "time": time,
      "payload": [newevent]
    });
  } else {
    grinderobj['events'][found].payload.push(newevent);
  }
}

// input: midiobj - midi file converted to JSON using Tonejs/midi's protocol
// output: grinder object (note ons and offs re-organized by common timing)
function analmidi(midiobj) {
  let grinderobj = { "events": [], "voices": []};

  midiobj.tracks.forEach((track, ind) => {
    track.notes.forEach(
    (note, index) => {
    // add noteOn msg to events
      place(grinderobj, {
        "type": "on",
        "midi": note.midi,
        "channel": note.channel,
        "velocity": note.velocity
      }, parseInt(note.ticks));
      // add noteOff msg to events
      place(grinderobj, {
        "type": "off",
        "channel": note.channel,
        "midi": note.midi
      }, parseInt(note.ticks) + parseInt(note.durationTicks));
    });
    track.pitchbends.forEach(
      (bend, index) => {
        place(grinderobj, {
          "type": "pitchbend",
          "channel": bend.channel,
          "semitones": bend.value
        }, parseInt(bend.ticks));
      }
    )});
  // sort events by timing to put everything in order
  grinderobj.events.sort((a,b) => a.time - b.time);
  // do the tuning-math with simultaneous pitchbend-noteons
  applyBends(grinderobj.events);
  return grinderobj;
}

// input: array of arrays of simultaneous events (noteOn, noteOff, pitchbend),
// ordered by time, but each events unordered
// mutates input array
function applyBends(eventses) {
  // fill array with default value of 0's
  let channelbends = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  // iterate
  eventses.forEach(events => {
    // pull pitchbends to the front of event groups
    events.payload.sort( (a,b) => 
      (a.type == "pitchbend" ? 0 : 1 ) + (b.type == "pitchbend" ? 0 : -1));
    // apply pitchbends to tracks 
    events.payload.forEach((item, index) => {
      switch(item.type) {
        case "pitchbend": channelbends[item.channel] = item.semitones; break;
        default: item.midi = item.midi + channelbends[item.channel]*2; 
      }
    });
  });
}