// Self-contained grindr class

// Player can be factored to somewhere else.
var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var player = new WebAudioFontPlayer();
let presetname;
// hard-coded reed organ. - overrode in
//let presetname = '_tone_0200_GeneralUserGS_sf2_file';
//player.loader.decodeAfterLoading(audioContext, presetname);

function NoteOn(pitch, amplitude = 0.2, dur = 999)
{
    return player.queueWaveTable(audioContext,
    audioContext.destination, window[presetname], 0,
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
        console.log(this.meat.events[this.i]);
        // trigger currently queued event
        this.meat.events[this.i].ons.forEach((item) =>
            this.meat.voices.push(NoteOn(item.midi)));
        this.meat.events[this.i].offs.forEach((item) => {
            let v = this.meat.voices.findIndex((voice) => voice.pitch == item.midi);
            if( v > -1)
            {
                this.meat.voices[v].cancel();
                this.meat.voices.splice(v, 1);
            }
        });

        // increment and modulo
        this.i = (this.i+1) % this.meat.events.length;

        // if there were no note ons or offs, grind to next.
        if( !this.meat.events[this.i].ons.length &&
            !this.meat.events[this.i].offs.length) {
                this.grindOnce();
            }

        // is next one soon? then do it, whether or not onned
        // is one after that soon? then do it, etc.
        // look ahead
        // disabled/broken for stop thinking edition.
        /*if( this.i != 0 && !lookahead ) { 
            while (((this.meat.events[this.i].time - this.meat.events[this.i-1].time) < lookahead))
            {
                this.grindOnce(true);
            }
        }*/

        // ensures that every keystroke triggers at least to the next note-on
        // --disabled for stop thinking edition--
        /*if( !ons && this.i != 0) {
            this.grindOnce();
        }*/
    }

    // helper function for backwardGrind and 
    nextNoteOffs() {
        this.meat.events[this.i].offs.forEach((item, index) =>
        {
            let v = this.meat.voices.findIndex((voice) => voice.pitch == item.midi);
            if( v > -1)
            {
                this.meat.voices[v].cancel();
                this.meat.voices.splice(v, 1);
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
    // still broken.
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