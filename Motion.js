var updateRate = 1/60; // Sensor refresh rate

function getAccel(){
    DeviceMotionEvent.requestPermission().then(response => {
        if (response == 'granted') {
            window.addEventListener('devicemotion', (event) => {
                dot = document.getElementsByClassName("indicatorDot")[0]
                if(event.acceleration.x > 1) { 
                    dot.setAttribute('style', "background-color:#4626e3");
                }
                if(event.acceleration.x == 0){
                    dot.setAttribute('style', "background-color:#9aff56");
                }
                else {
                    dot.setAttribute('style', "background-color:#ffab56");
                }
            });
            // Add a listener to get smartphone orientation 
           // in the alpha-beta-gamma axes (units in degrees)
            window.addEventListener('deviceorientation',(event) => {
                // Expose each orientation angle in a more readable way
                // rotation_degrees = event.alpha;
                // frontToBack_degrees = event.beta;
                // leftToRight_degrees = event.gamma;
                
                // // Update velocity according to how tilted the phone is
                // // Since phones are narrower than they are long, double the increase to the x velocity
                // vx = vx + leftToRight_degrees * updateRate*2; 
                // vy = vy + frontToBack_degrees * updateRate;
                
                // // Update position and clip it to bounds
                // px = px + vx*.5;
                // if (px > 98 || px < 0){ 
                //     px = Math.max(0, Math.min(98, px)) // Clip px between 0-98
                //     vx = 0;
                // }

                // py = py + vy*.5;
                // if (py > 98 || py < 0){
                //     py = Math.max(0, Math.min(98, py)) // Clip py between 0-98
                //     vy = 0;
                // }
                
                // dot = document.getElementsByClassName("indicatorDot")[0]
                // dot.setAttribute('style', "background-color:#4626e3");
                
            });
        }
    });
}