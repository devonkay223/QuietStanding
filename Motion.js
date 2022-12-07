var x, y, z;
var vol =0;
var prevAvg = 1;
var chunkCount= 0;
var chunkAvg = 0;
var up = 1; 

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
  // if (isAppInit) {
  //   return;
  // }
  // window.open("https://devonkay223.github.io/QuietStanding/BackPlate.html", '_blank');

  console.log("in audio")

  // create web audio api context
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  // create Oscillator and gain node
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // connect oscillator to gain node to speakers
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // const maxFreq = 6000;
  // const maxVol = 1;
  // const initialVol = 0;

  let freqList= [90, 100, 120, 140, 150, 160, 180, 190]
  let freq= freqList[getRandomInt(8)]
  console.log("frequency: ", freq);

  // set options for the oscillator
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz
  oscillator.start();

  // oscillator.onended = function () {
  //   console.log("Your tone has now stopped playing!");
  // };

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
      console.log("chunkAvg: ", chunkAvg);
      console.log("vol before: ", vol);
      if ((((chunkAvg - 0.005) > prevAvg || (chunkAvg >= 0.15)) && (chunkAvg > 0.065)) && (vol > 0)) {
        vol = vol - 0.05 
        if (vol < 0) {
          vol =0
        }
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value , audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 1);
        console.log("vol down: ", vol);
      } else if ((vol < 1) && (avg < 0.2)) {
        vol = vol + 0.05;
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value , audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 1);
        console.log("vol up: ", vol);
      }
      chunkAvg = 0; // reset average for next chunk
      prevAvg = chunkAvg;
    } 
  });
  isAppInit = true;
}
  

function audio3() {
  // if (isAppInit) {
  //   return;
  // }


  // create web audio api context
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  // create Oscillator and gain node
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // connect oscillator to gain node to speakers
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const maxFreq = 6000;
  const maxVol = 0.2;
  const initialVol = 0;

  // set options for the oscillator
//   oscillator.detune.value = 100; // value in cents
  oscillator.frequency.setValueAtTime(250, audioCtx.currentTime); // value in hertz
  oscillator.start(0);

  oscillator.onended = function () {
    console.log("Your tone has now stopped playing!");
  };

  gainNode.gain.value = initialVol;
  gainNode.gain.minValue = initialVol;
  gainNode.gain.maxValue = initialVol;

  // Mouse pointer coordinates
  
  let avg = 0;
  window.onmousemove = function( e ) { 
    avg = scaleNum(e.clientY, [0, 1000], [0, 0.5])

   
    // console.log("motion")
    // // can you change the rate of sampling on listeners?
    // x = Math.abs(parseFloat(e.acceleration.x).toFixed(3))
    // y = Math.abs(parseFloat(e.acceleration.y).toFixed(3))
    // z = Math.abs(parseFloat(e.acceleration.z).toFixed(3))

    // console.log(x, ", ", y, ", ",z)
    // avg = ((x+y+z)/3.00)
    chunkCount = chunkCount + 1;
    let a = chunkAvg
    chunkAvg = a + avg;
    // console.log("count: ", chunkCount," Chunkavg: ",chunkAvg,  " avg: ", avg)

    if (chunkCount==20) {
      chunkCount = 0 
      chunkAvg = chunkAvg / 20;
      console.log("chunkAvg: ", chunkAvg);
      console.log("vol before: ", vol);
      if ((((chunkAvg - 0.005) > prevAvg || (chunkAvg >= 0.2)) && (chunkAvg > 0.065)) && (vol > 0)) {

        //scaled = scaleNum(Math.abs(avg)*1000, [250, 4000], [100, ])// /100
        vol = vol - 0.01 //(0.001 * scaled)
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value , audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 2);
        console.log("vol down: ", vol);
      } else if ((vol < 1) && (avg < 0.2)) {
        //scaled = scaleNum(Math.abs(avg)*1000, [0, 250], [100, 0])// /100
        // console.log("scaled: ", scaled)
        vol = vol + 0.01  //(0.001 * scaled)
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value , audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 2);
        console.log("vol up: ", vol);
      }
      chunkAvg = 0;
      prevAvg = chunkAvg;
    } 
  }
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
