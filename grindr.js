// Self-contained grindr class

// Player can be factored to somewhere else.
var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var player = new WebAudioFontPlayer();
// hard-coded piano for now
let presetname = '_tone_0000_JCLive_sf2_file';
player.loader.decodeAfterLoading(audioContext, presetname);
function NoteOn(pitch, amplitude = 0.2, dur = 999)
{
    return player.queueWaveTable(audioContext,
    audioContext.destination, _tone_0000_JCLive_sf2_file, 0,
    // pitch, max duration, amplitude
    pitch, dur, amplitude);
}

class MightyMeatyMIDIGrindr 
{
    constructor(meat)
    {
        // meat holds the MIDI events
        this.meat = meat;

        // i is the counter/cursor
        this.i = 0;

        // arpeggiation fgeature
        this.arp = -1;
        this.strands = [];
    }

    grindOnce(lookahead = false)
    {
        // trigger payload contents of currently queued event
        let ons = 0;
        this.meat.events[this.i].payload.forEach((item, index) =>
        {
            if (item.type == "on")
            {
                ons++;
                this.meat.voices.push(NoteOn(item.midi));
            }
            if (item.type == "off")
            {
                let v = this.meat.voices.findIndex((voice) => voice.pitch == item.midi);
                if( v > -1)
                {
                    this.meat.voices[v].cancel();
                    this.meat.voices.splice(v, 1);
                }
            }
        });

        // increment and modulo
        this.i = (this.i+1) % this.meat.events.length;

        // is next one soon? then do it, whether or not onned
        // is one after that soon? then do it, etc.
        // look ahead
        if( this.i != 0 && !lookahead ) { 
            while (((this.meat.events[this.i].time - this.meat.events[this.i-1].time) < lookahead))
            {
                this.grindOnce(true);
            }
        }

        // ensures that every keystroke triggers at least to the next note-on
        if( !ons && this.i != 0) {
            this.grindOnce();
        }
    }

    // helper function for backwardGrind and 
    nextNoteOffs() {
        this.meat.events[this.i].payload.forEach((item, index) =>
        {
            if (item.type == "on") {
                return;
            }
            if (item.type == "off") {
                let v = this.meat.voices.findIndex((voice) => voice.pitch == item.midi);
                if( v > -1)
                {
                    this.meat.voices[v].cancel();
                    this.meat.voices.splice(v, 1);
                }
            }
        });
    }

    // step one backward
    backwardGrind()
    {
        this.nextNoteOffs();        
        this.i = this.lookBehind(this.i);
        this.grindOnce();
    }
    
    // helper function for backwardGrind
    lookBehind(ig)
    {
        ig--;
        while( ig > 0)
        {
            ig--;
            if( this.meat.events[ig].payload.findIndex((item) => item.type == "on") > -1) {
                return ig;
            }
        }
        ig = this.meat.events.length - 1;
        return this.lookBehind(ig);
    }

    // repeat the most recent event
    regrind() {
        // off the notes
        this.nextNoteOffs();
        this.i = (this.i-1) % this.meat.events.length;
        this.grindOnce();
    }

    jumpAndGrind(new_i) {
        this.allOff();
        this.i = new_i;
        this.grindOnce();
    }

    arpeggiate()
    {
        // going from full chord to voices; harvest the pitches ('strands)
        if(this.arp == -1)
        { 
            this.strands = [];
            this.meat.voices.forEach((item, index) => {
                this.strands.push(item.pitch);
            });
        }
        this.arp++;
        // after arpeggiating thru all, replay full chord & reset pitch memory
        if(this.arp == this.strands.length)
        {
            this.arp = -1;
            this.strands = [];
            this.regrind();
            return;
        }
        // turn off previous voice(s)
        this.allOff();
        // turn on current voice
        this.meat.voices.push( NoteOn(this.strands[this.arp]));
    }

    allOff() 
    {  
        this.meat.voices.forEach((item, index) => {
            item.cancel();
        });
        this.meat.voices = [];
    }
}