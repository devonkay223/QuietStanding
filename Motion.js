var x, y, z;
var vol =0;
var prevAvg = 1;
var chunkCount= 0;
var chunkAvg = 0;

//Notes from Karl
// - high tones in, play backing tone
// - wants a spacial mapping to explore within the space (this would be nice for having spots of amplified sound from phones)
// - check how to do device motion on andriod 
// - generate QR code


function getPerm() {
    // feature detect
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            console.log("granted");
            window.location.replace('https://devonkay223.github.io/QuietStanding/Audio.html')
          }
        })
        .catch(console.error);
    } else {
      console.log("denied");
    }
}


function audio2() {
  // create web audio api context
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  // create Oscillator and gain node
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // connect oscillator to gain node to speakers
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  let freqList= [150, 160, 170, 180, 190, 200, 210, 220]
  let freq= freqList[getRandomInt(8)]

  // set options for the oscillator
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz
  oscillator.start();

  gainNode.gain.value = 0.05;
  gainNode.gain.minValue = 0;
  gainNode.gain.maxValue = 1;
  
  let avg = 0;

  window.addEventListener('devicemotion', (e) => { 
    //moiton in x, y, z
    x = Math.abs(parseFloat(e.acceleration.x).toFixed(3))
    y = Math.abs(parseFloat(e.acceleration.y).toFixed(3))
    z = Math.abs(parseFloat(e.acceleration.z).toFixed(3))

    //average motion and increase chunk count
    avg = ((x+y+z)/3.00)
    chunkCount = chunkCount + 1;
    let a = chunkAvg
    chunkAvg = a + avg;

    // when 20 motion samples have been collected evlauate average and index volume
    // Decrease volume: 
    //   the sample's avgerage is greater than the pervious average
    //   the average is above the motion roof (0.2) or below the motion floor (0.065)
    //   volume is already 0
    // otherwise increase volume if less than 1 and avgerage is less than the motion roof (0.2)

    if (chunkCount==20) {
      chunkCount = 0 
      chunkAvg = chunkAvg / 20;
      if ((((chunkAvg - 0.005) > prevAvg || (chunkAvg >= 0.15)) && (chunkAvg > 0.065)) && (vol > 0)) {
        vol = vol - 0.1 //decrease volume 
        //make sure volume isnt out of range
        if (vol < 0) {
          vol =0
        }
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value , audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 1);      
      } 
      else if ((vol < 1) && (avg < 0.2)) 
      {
        vol = vol + 0.05; //increase volume
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value , audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 1);
      }
      chunkAvg = 0; // reset average for next chunk
      prevAvg = chunkAvg;
    } 
  });
  isAppInit = true;
}
  
const scaleNum = (number, fromInterval, toInterval) => {
  if(number >= fromInterval[0] && number <= fromInterval[1]) {
    let oldIntervalUnits = fromInterval[1] - fromInterval[0] + 1;
    let newIntervalUnits = toInterval[1] - toInterval[0] + 1;

    let oldNumberPosition = -fromInterval[0] + number + 1;

    let percentage = oldNumberPosition / oldIntervalUnits;
    
    let newNumberPosition = Math.round(percentage * newIntervalUnits);

    return toInterval[0] + newNumberPosition - 1;
 }
 return NaN;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

//background bass to play during
function audio4() {
  // create web audio api context
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  // create Oscillator and gain node
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // connect oscillator to gain node to speakers
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // set options for the oscillator
  oscillator.frequency.setValueAtTime(80, audioCtx.currentTime); // value in hertz
  oscillator.start();

  gainNode.gain.value = 0.5;
  gainNode.gain.minValue = 0;
  gainNode.gain.maxValue = 1;
  
  isAppInit = true;
}

//Potential Solution to screens sleeping -- not in use rn

// // Create the root video element
// var video = document.createElement('video');
// video.setAttribute('loop', '');
// // Add some styles if needed
// video.setAttribute('style', 'position: fixed;');

// // A helper to add sources to video
// function addSourceToVideo(element, type, dataURI) {
//     var source = document.createElement('source');
//     source.src = dataURI;
//     source.type = 'video/' + type;
//     element.appendChild(source);
// }

// // A helper to concat base64
// var base64 = function(mimeType, base64) {
//     return 'data:' + mimeType + ';base64,' + base64;
// };

// // Add Fake sourced
// addSourceToVideo(video,'webm', base64('video/webm', 'GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA='));
// addSourceToVideo(video, 'mp4', base64('video/mp4', 'AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAAA+gAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJlc2RzAAAAAANEAAEABDwgEQAAAAADDUAAAAAABS0AAAGwAQAAAbWJEwAAAQAAAAEgAMSNiB9FAEQBFGMAAAGyTGF2YzUyLjg3LjQGAQIAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAEwAAAAEAAAAUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAK2lsc3QAAAAjqXRvbwAAABtkYXRhAAAAAQAAAABMYXZmNTIuNzguMw=='));

// // Append the video to where ever you need
// document.body.appendChild(video);

// // Start playing video after any user interaction.
// // NOTE: Running video.play() handler without a user action may be blocked by browser.
// var playFn = function() {
//     video.play();
//     document.body.removeEventListener('touchend', playFn);
// };
// document.body.addEventListener('touchend', playFn);