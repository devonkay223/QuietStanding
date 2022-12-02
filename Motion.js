var x, y, z;

function getPerm() {
  // feature detect
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          console.log("granted 1");
        }
      })
      .catch(console.error);
  } else {
    console.log("denied");
  }
    const index = param( 'idx', 0, 0, 0.95)
    x = Math.abs(0.4356)
    y = Math.abs(-0.3928)
    z = Math.abs(-0.243543)

    console.log(x, ", ", y, ", ",z)
    let avg = ((x+y+z)/3.00)
    // console.log("avg: ", avg)
    //average data for chunks
    //set benchmarks for movement
    //perform linear smoothing between amplitude changes
    // index.value = index.value -1
    // console.log("value: ", index.value)
    // console.log("waapi value: ", index.waapi.value)
    // index.waapi.value = index.waapi.value - 1 
    // console.log("waapi value: ", index.waapi.value)
    // index.waapi.value = scaleNum(Math.abs(avg)*1000, [0, 250], [100, 0])/100
    // console.log("value: ", index.waapi.value)  
}

window.onload = ()=> {
  // genish.js
  genish.export( window );

  // audio context will be stored in utilities.ctx
  utilities.createContext();
}


function audio() {
  // const ctx = utilities.ctx
  const baseFrequency = 80
  const c2m = 1.4
  const index = param( 'idx',0, 0, 0.95)
  console.log("in audio")
  // create our oscillator for modulation
  // const  modulator = cycle( mul( baseFrequency, c2m ) )

  // scale amplitude based on index value, re-assign
  const modulator = mul( cycle( mul( baseFrequency, c2m ) ), mul( baseFrequency, index ) )

  // create carrier oscillator and modulate frequency
  const carrier = cycle( add( baseFrequency, modulator ) )
  utilities.playWorklet(modulator)

  console.log("playing audio")

  //add a loop here that grabs chunks of data 
  //dont want to call listener on every loop BUT dont want loop called on every motion event 

  let avg = 0
  let scaled = 0
  let vol = 0.000

  //gradient up to .05 for sounds
  window.addEventListener('devicemotion', function(e) 
  { 
    // console.log("motion")
    // can you change the rate of sampling on listeners?
    x = Math.abs(parseFloat(e.acceleration.x).toFixed(3))
    y = Math.abs(parseFloat(e.acceleration.y).toFixed(3))
    z = Math.abs(parseFloat(e.acceleration.z).toFixed(3))

    console.log(x, ", ", y, ", ",z)
    avg = ((x+y+z)/3.00)
    console.log("avg: ", avg)
    //average data for chunks
    //set benchmarks for movement
    //perform linear smoothing between amplitude changes 
    if (avg >= 0.25) {
      index.value = vol - 0.01
    }
    else {
      scaled = scaleNum(Math.abs(avg)*1000, [0, 250], [100, 0])/100
      index.value = vol + 0.01
    }
    console.log("vol: ", vol)
    console.log("value: ", index.value)
    console.log("waapi value: ", index.waapi.value)   
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
    console.log(carrierFrequency.waapi.value)
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