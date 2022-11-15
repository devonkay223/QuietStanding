const devicemotion = new DeviceMotionEvent("devicemotion")

if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', deviceMotionHandler);
    // setTimeout(stopJump, 3 * 1000);
    console.log('supported');
  }
else {
    console.log("not supported");
}

window.addEventListener('devicemotion', (event) => {
    console.log(`${event.acceleration.x} m/s2`);
  });

function deviceMotionHandler(){
   // do stuff here
}