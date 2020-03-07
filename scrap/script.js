var ctx = new AudioContext();

function sf1() {
    return soundfont.instrument(
      'clavinet')
    .then(function(clavinet) {
          console.log(4);
          return clavinet.play('C4')
        }
    );
    console.log(3);
  };