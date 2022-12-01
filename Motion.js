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
  console.log(Math.abs(-0.88));
  console.log(scaleNum(Math.abs(-0.088)*1000, [0, 250], [100, 0]));
  console.log(scaleNum(Math.abs(-0.088)*1000, [0, 250], [100, 0])/100);
}

window.onload = ()=> {
  // genish.js
  genish.export( window );

  // audio context will be stored in utilities.ctx
  utilities.createContext();
}


function audio() {
  const ctx = utilities.ctx
  const baseFrequency = 180,
  c2m = 1.4,
  index = param( 'idx', 0, 0, 0.95 )

  // create our oscillator for modulation
  let  modulator = cycle( mul( baseFrequency, c2m ) );


  // scale amplitude based on index value, re-assign
  modulator = mul( modulator, mul( baseFrequency, index ) );

  // create carrier oscillator and modulate frequency
  const carrier = cycle( add( baseFrequency, modulator ) );
  utilities.playWorklet(carrier);

  //add a loop here that grabs chunks of data 
  //dont want to call listener on every loop BUT dont want loop called on every motion event 

  //gradient up to .05 for sounds
  window.addEventListener('devicemotion', function(e) 
  { 

    // can you change the rate of sampling on listeners?
      x = parseFloat(e.acceleration.x).toFixed(3);
      y = parseFloat(e.acceleration.y).toFixed(3);
      z = parseFloat(e.acceleration.z).toFixed(3); 

  
    //average data for chunks
    //set benchmarks for movement
    //perform linear smoothing between amplitude changes 
    let scalVal= scaleNum(Math.abs(x)*1000, [0, 250], [100, 0])/100;
    console.log(scalVal);
    index.value = scalVal;
    console.log(x, scalVal, index.value);    
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
};