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

function nextPage() {
    //TEST --> change for devonkay223.github.io/QuietStanding/BackPlate.html
    window.location.replace('https://devonkay223.github.io/QuietStanding/BackPlate.html')
    //window.location.replace('http://127.0.0.1:8887/BackPlate.html');
  }