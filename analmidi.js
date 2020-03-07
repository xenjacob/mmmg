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
        "velocity": note.velocity
      }, parseInt(note.ticks));
      // add noteOff msg to events
      place(grinderobj, {
        "type": "off",
        "midi": note.midi
      }, parseInt(note.ticks) + parseInt(note.durationTicks));
    })});
  // sort events by timing to put everything in order
  grinderobj.events.sort((a,b) => a.time - b.time);
  return grinderobj;
}