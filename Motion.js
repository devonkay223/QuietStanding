var x, y, z;

function setup() 
{
  // set canvas size
  createCanvas(400, 400);
  frameRate(20);

  // default values
  x = 0;
  y = 0;
  z = 0;
}

function draw() {
    
}

//z accelerometer Data
window.addEventListener('devicemotion', function(e) 
{ 
  x = parseFloat(e.acceleration.x).toFixed(3);
  y = parseFloat(e.acceleration.y).toFixed(3);
  z = parseFloat(e.acceleration.z).toFixed(3); 
  
  //gradient up to .15 for sound 
  
});

function getPerm(){
  DeviceMotionEvent.requestPermission()
}
