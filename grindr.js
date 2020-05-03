// Self-contained grindr class

// Player can be factored to somewhere else.
var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var player = new WebAudioFontPlayer();
let presetname;
// hard-coded reed organ. - overrode in
//let presetname = '_tone_0200_GeneralUserGS_sf2_file';
//player.loader.decodeAfterLoading(audioContext, presetname);

function NoteOn(pitch, amplitude, dur = 999)
{
    return player.queueWaveTable(audioContext,
    audioContext.destination, window[presetname], 0,
    // pitch, max duration, amplitude
    pitch, dur, amplitude);
}

class MightyMeatyMIDIGrindr 
{
    constructor(meat, options = { forceOns: true})
    {
        // meat holds the MIDI events
        this.meat = meat;

        // i is the counter/cursor
        this.i = 0;

        // arpeggiation fgeature
        this.arp = -1;
        this.strands = [];

        // grind options
        this.options = options;
    }

    // update options
    updateOptions( opts ) {
        this.options = opts;
    }

    grindOnce(lookahead = false)
    {
        // trigger payload contents of currently queued event
        let ons = 0, offs = 0;
        this.meat.events[this.i].payload.forEach((item, index) =>
        {
            console.log(item);
            if (item.type == "on")
            {
                ons++;
                this.meat.voices.push(NoteOn(item.midi, item.velocity/5.0));
            }
            if (item.type == "off")
            {
                offs++;
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

        // will not grind again if looped back to beginning
        if( this.i != 0) {
            // will grind again if no ons or offs have occurred
            if(!(offs || ons))
            {
                this.grindOnce();
            }
            else {
                // will grind again if forceOns option and no ons have occurred
                if( this.options.forceOns && !ons) {
                    this.grindOnce();
                }
            }
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