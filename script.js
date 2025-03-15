import Spheres1Background from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.17/build/backgrounds/spheres1.cdn.min.js'

const bg = Spheres1Background(document.getElementById('webgl-canvas'), {
  count: 300,
  minSize: 0.3,
  maxSize: 1,
  gravity: 0.5
})

// document.body.addEventListener('click', () => {
//   bg.spheres.setColors([0xffffff * Math.random(), 0xffffff * Math.random(), 0xffffff * Math.random()])
// })

//document.body.addEventListener('keydown', (ev) => {
//  bg.spheres.config.gravity = bg.spheres.config.gravity === 0 ? 1 : 0
//})

document.getElementById('gravity-btn').addEventListener('click', () => {
  bg.spheres.config.gravity = bg.spheres.config.gravity === 0 ? 1 : 0
})

document.getElementById('colors-btn').addEventListener('click', () => {
  bg.spheres.setColors([0xffffff * Math.random(), 0xffffff * Math.random(), 0xffffff * Math.random()])
})

// Function to handle device orientation and dispatch a synthetic mousemove event
function handleOrientation(event) {
  // Map device orientation angles to canvas coordinates:
  // event.gamma (left/right tilt, typically in [-90, 90]) is mapped to the x-coordinate.
  // event.beta (front/back tilt, typically in [-90, 90]) is mapped to the y-coordinate.
  const x = (event.gamma + 90) / 180 * window.innerWidth;
  const y = (event.beta + 90) / 180 * window.innerHeight;
  
  // Create and dispatch a synthetic mousemove event to the canvas
  const simulatedEvent = new MouseEvent('mousemove', {
    clientX: x,
    clientY: y
  });
  document.getElementById('webgl-canvas').dispatchEvent(simulatedEvent);
}

// Request permission for device orientation events on iOS (if necessary), otherwise just add the event listener
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
  // For iOS 13+ devices
  DeviceOrientationEvent.requestPermission()
    .then(response => {
      if (response === 'granted') {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    })
    .catch(console.error);
} else {
  // For other devices that don't require permission
  window.addEventListener('deviceorientation', handleOrientation);
}

