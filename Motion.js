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

window.onload = ()=> {
  // genish.js
  // genish.export( window );
  // audio context will be stored in utilities.ctx
  // utilities.createContext();

  //TEST does this work on load???
  audio3()
  //TEST do i need motion permission on the same page or does this work?
}

function nextPage() {
  window.location.replace('http://127.0.0.1:8887/Audio.html');
}


function audio() {
  // const ctx = utilities.ctx
  const baseFrequency = 440
  // const c2m = 1.4
  const index = param( 'idx',0,0, 1)

  // create our oscillator for modulation
  // const  modulator = cycle( mul( baseFrequency, c2m ) )

  // scale amplitude based on index value, re-assign
  // const portamento = slide( index, 1000 )
  // const modulator = mul( cycle( mul( baseFrequency, c2m ) ), mul( baseFrequency, slide( index, 800 ) ) )
  const modulator = mul( cycle( baseFrequency ), slide( index, 1000 ) )
  // const modulator = cycle(baseFrequency);
  // create carrier oscillator and modulate frequenc8
  //const carrier = cycle( add( baseFrequency, modulator ) )
  //utilities.playWorklet(modulator)

  //add a loop here that grabs chunks of data 
  //dont want to call listener on every loop BUT dont want loop called on every motion event 

  let avg = 0
  //let scaled = 0
  //play(modulator)

  //gradient up to .05 for sounds
  utilities.playWorklet( modulator ).then( node => {
    window.addEventListener('devicemotion', function(e) 
    { 
      // console.log("motion")
      // can you change the rate of sampling on listeners?
      x = Math.abs(parseFloat(e.acceleration.x).toFixed(3))
      y = Math.abs(parseFloat(e.acceleration.y).toFixed(3))
      z = Math.abs(parseFloat(e.acceleration.z).toFixed(3))

      console.log(x, ", ", y, ", ",z)
      avg = ((x+y+z)/3.00)
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
          node.idx = vol 
          console.log("vol down: ", vol);
        } else if ((vol < 1) && (avg < 0.2)) {
          //scaled = scaleNum(Math.abs(avg)*1000, [0, 250], [100, 0])// /100
          // console.log("scaled: ", scaled)
          vol = vol + 0.01  //(0.001 * scaled)
          node.idx = vol
          console.log("vol up: ", vol);
        }
        chunkAvg = 0
        prevAvg = chunkAvg
      } 



      //average data for chunks
      //set benchmarks for movement
      //perform linear smoothing between amplitude changes 

      // if (((avg> prevAvg) || (avg >= 0.2)) && (vol >0)){
      //     //scaled = scaleNum(Math.abs(avg)*1000, [250, 4000], [100, ])// /100
      //     vol = vol - 0.001 //(0.001 * scaled)
      //     index.value = vol 
      // }else if ((vol < 1) && (avg < 0.2)) {
      //   //scaled = scaleNum(Math.abs(avg)*1000, [0, 250], [100, 0])// /100
      //   // console.log("scaled: ", scaled)
      //   vol = vol + 0.0005//(0.001 * scaled)
      //   index.value = vol
      // }
      // prevAvg = avg

      // if (avg >= 0.25) {
      //   if (vol>0){
      //     scaled = scaleNum(Math.abs(avg)*1000, [250, 4000], [100, ])// /100
      //     vol = vol - (0.001 * scaled)
      //     index.value = vol 
      //   }
      // }
      // else {
      //   scaled = scaleNum(Math.abs(avg)*1000, [0, 250], [100, 0])// /100
      //   console.log("scaled: ", scaled)
      //   if (vol<1) {
      //     vol = vol + (0.001 * scaled)
      //     index.value = vol
      //   }
      // }
      // console.log("vol: ", vol)
      //console.log("value: ", index.value)
      // console.log("waapi value: ", index.waapi.value)   
    });
  })
}


function test4() {
  console.log("test4");
  const ctx = utilities.ctx
  const baseFrequency = 180,
  c2m = 1.4
  //index = param( 'idx', 0, 0.5, 1 )

  pattern = [ 440, 660, 880, 1100 ]
  idx = 0
  frequency = param( pattern[ idx ], 0, 440, 1200 )
  console.log(frequency);
  console.log(frequency.value)

  utilities.playWorklet( cycle( frequency ) )

  // change frequency every 100ms (approximately, setInterval is not sample accurate) 
  intrvl = setInterval( ()=> { 
  frequency.value = pattern[ idx++ % pattern.length ];
  }, 100 )
}

function test3(){
  // param argumemnts: name, default value, min, max
  const carrierFrequency = param( 'freq', 0.5, 0, 990 )
  const modulationDepth  = param( 'mod', 5,0,100 )

  const modulator = mul( cycle(4), modulationDepth )
  const modulatedFrequency = add( carrierFrequency, modulator )

  utilities.playWorklet( cycle( modulatedFrequency ) )

  window.onmousemove = function( e ) { 
    const percentY = e.clientY / window.innerHeight,
          percentX = e.clientX / window.innerWidth
    
    // get a frequency range of {110,990}
    carrierFrequency.value = 990 - (percentY * 880)
    // console.log(carrierFrequency.waapi.value)
  }

}

function test2() {
  const baseFrequency = 80
  const c2m = 1.4
  const index = 0.2
  // create our oscillator for modulation
  let  modulator = cycle( mul( baseFrequency, c2m ) )

  // scale amplitude based on index value, re-assign
  modulator = mul( modulator, mul( baseFrequency, index ) )

  // create carrier oscillator and modulate frequency
  const carrier = cycle( add( baseFrequency, modulator ) )
  utilities.playWorklet(modulator)
}

// function test8() {
//   utilities.playWorklet(cycle(440));
// }



// function init() {
//   if (isAppInit) {
//     return;
//   }

//   // create web audio api context
//   const AudioContext = window.AudioContext || window.webkitAudioContext;
//   const audioCtx = new AudioContext();

//   // create Oscillator and gain node
//   const oscillator = audioCtx.createOscillator();
//   const gainNode = audioCtx.createGain();

//   // connect oscillator to gain node to speakers
//   oscillator.connect(gainNode);
//   gainNode.connect(audioCtx.destination);

//   const maxFreq = 6000;
//   const maxVol = 0.2;
//   const initialVol = 0.001;

//   // set options for the oscillator
// //   oscillator.detune.value = 100; // value in cents
//   oscillator.start(0);

//   oscillator.onended = function () {
//     console.log("Your tone has now stopped playing!");
//   };

//   gainNode.gain.value = initialVol;
//   gainNode.gain.minValue = initialVol;
//   gainNode.gain.maxValue = initialVol;

//   // Mouse pointer coordinates
//   let loudness;

//   // Get new mouse pointer coordinates when mouse is moved
//   // then set new gain and pitch values
//   document.addEventListener('devicemotion', (event) => {updatePage(event)});

//   function updatePage(e) {
//     let x = e.acceleration.x;
//     let y = e.acceleration.y;
//     let z = e.acceleration.z;
//     let speed = Math.sqrt(x*x + y*y + z*z);
//     if (speed > 0.05) {
//         loudness = Math.max(0.0, loudness - 0.01);
//     }
//     else {
//         loudness = Math.min(1.0, loudness + 0.01)
//     }
//     oscillator.frequency.value = 440;
//     gainNode.gain.value = speed * maxVol;
//   }

//   isAppInit = true;
// }

function audio2() {
  // if (isAppInit) {
  //   return;
  // }

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

  const maxFreq = 6000;
  const maxVol = 0.2;
  const initialVol = 0;

  // set options for the oscillator
  oscillator.frequency.setValueAtTime(250, audioCtx.currentTime); // value in hertz
  oscillator.start();

  oscillator.onended = function () {
    console.log("Your tone has now stopped playing!");
  };

  gainNode.gain.value = initialVol;
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
      if ((((chunkAvg - 0.005) > prevAvg || (chunkAvg >= 0.2)) && (chunkAvg > 0.065)) && (vol > 0)) {
        vol = vol - 0.01 
        if (vol < 0) {
          vol =0
        }
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value , audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 1);
        console.log("vol down: ", vol);
      } else if ((vol < 1) && (avg < 0.2)) {
        vol = vol + 0.01;
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
