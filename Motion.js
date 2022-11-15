const devicemotion = new DeviceMotionEvent('devicemotion');

if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', (event) => {
        console.log(`${event.acceleration.x} m/s2`);
      });
    console.log('supported');
  }
else {
    console.log("not supported");
}



function deviceMotionHandler(event){
   // do stuff here
}