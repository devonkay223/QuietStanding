var x, y, z;

function getPerm() {
  // feature detect
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          //window.addEventListener('devicemotion', () => {});
          console.log("from perm")
          audio();
        }
      })
      .catch(console.error);
  } else {
    console.log("denied");
  }
}

window.onload = ()=> {
  // window.addEventListener( 'click', audio ) 
  window.addEventListener('touchstart', audio);  
  genish.export( window );

  // audio context will be stored in utilities.ctx
  utilities.createContext();
}


function audio() {
  const baseFrequency = 80,
  c2m = 1.4,
  index = param( 'idx', 0, 0.5, 1 )

  // create our oscillator for modulation
  let  modulator = cycle( mul( baseFrequency, c2m ) );


  // scale amplitude based on index value, re-assign
  modulator = mul( modulator, mul( baseFrequency, index ) );

  // create carrier oscillator and modulate frequency
  const carrier = cycle( add( baseFrequency, modulator ) );
  utilities.playWorklet(carrier);

  
  //gradient up to .05 for sound 
  // index.value = scaleNum(x*100, [1, 25], [10, 0]);
  // console.log(index.value/10, " x: ", x);

  window.addEventListener('devicemotion', function(e) 
  { 
    x = parseFloat(e.acceleration.x).toFixed(3);
    y = parseFloat(e.acceleration.y).toFixed(3);
    z = parseFloat(e.acceleration.z).toFixed(3); 
    //gradient up to .05 for sound 
    //index.value = scaleNum(abs(x)*100, [1, 25], [10, 0])/10;
    console.log(scaleNum(abs(x)*100, [1, 25], [10, 0])/10, ", x: ", x, "\n")
    //console.log(index.value, " x: ", x);

    
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