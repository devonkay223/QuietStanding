var x, y, z;

function getPerm() {
  // feature detect
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          console.log("granted");
        }
      })
      .catch(console.error);
  } else {
    console.log("denied");
  }
  // pattern = [ 440, 660, 880, 1100 ]
  // idx = 0
  // index = param(pattern[idx], 0.1, 0, 0.95);
  // console.log(index.value);
  // index.value = 0.5;
  // console.log(index.value);
  // console.log(index);
  
}

window.onload = ()=> {
  // genish.js
  genish.export( window );

  // audio context will be stored in utilities.ctx
  utilities.createContext();
}


function audio() {
  // const ctx = utilities.ctx
  const baseFrequency = 180
  const c2m = 1.4
  const index = param( 'idx', 0, 0, 0.95)

  // create our oscillator for modulation
  // const  modulator = cycle( mul( baseFrequency, c2m ) )


  // scale amplitude based on index value, re-assign
  const modulator = mul( cycle( mul( baseFrequency, c2m ) ), mul( baseFrequency, index ) )

  // create carrier oscillator and modulate frequency
  const carrier = cycle( add( baseFrequency, modulator ) )
  utilities.playWorklet(carrier)

  //add a loop here that grabs chunks of data 
  //dont want to call listener on every loop BUT dont want loop called on every motion event 

  //gradient up to .05 for sounds
  window.addEventListener('devicemotion', function(e) 
  { 

    // can you change the rate of sampling on listeners?
      x = parseFloat(e.acceleration.x).toFixed(3)
      y = parseFloat(e.acceleration.y).toFixed(3)
      z = parseFloat(e.acceleration.z).toFixed(3);

  
    //average data for chunks
    //set benchmarks for movement
    //perform linear smoothing between amplitude changes 
    index.value = scaleNum(Math.abs(x)*1000, [0, 250], [100, 0])/100
    console.log(scaleNum(Math.abs(x)*1000, [0, 250], [100, 0])/100, ", ", x)   
  });
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
  const carrierFrequency = param( 'freq', 440, 110, 990 )
  const modulationDepth  = param( 'mod', 5,0,100 )

  const modulator = mul( cycle(4), modulationDepth )
  const modulatedFrequency = add( carrierFrequency, modulator )

  utilities.playWorklet( cycle( modulatedFrequency ) )

  window.addEventListener('devicemotion', function(e) 
    { 

      // can you change the rate of sampling on listeners?
        x = parseFloat(e.acceleration.x).toFixed(3)
        y = parseFloat(e.acceleration.y).toFixed(3)
        z = parseFloat(e.acceleration.z).toFixed(3)

    
    // get a frequency range of {110,990}
    carrierFrequency.value = scaleNum(Math.abs(x)*1000, [0, 250], [110, 990])
    modulationDepth.value  = scaleNum(Math.abs(y)*1000, [0, 250], [110, 990])
    // console.log(carrierFrequency.value, ", ", modulationDepth.value)
  });
}