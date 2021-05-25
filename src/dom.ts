import { PhotoCamera } from "./media";

export const camera = PhotoCamera();

const SHUTTER_SPEED = 0.15;
const CLOSED_SHUTTER_TIME = 0.2;
const leftShutter = creatShutter();
leftShutter.style.left = "0";
const rightShutter = creatShutter();
rightShutter.style.right = "0";

function creatShutter() {
  const shutter = document.createElement("div");
  shutter.style.height = "100%";
  shutter.style.width = "0px";
  shutter.style.background = "black";
  shutter.style.position = "absolute";
  shutter.style.top = "0";
  shutter.style.transition = SHUTTER_SPEED + "s";
  return shutter;
}

export function closeAndOpenShutter() {
  leftShutter.style.width = "50px";
  rightShutter.style.width = "50px";
  setTimeout(() => {
    leftShutter.style.width = "0";
    rightShutter.style.width = "0";
  }, (SHUTTER_SPEED + CLOSED_SHUTTER_TIME) * 1000);
}

function adjustViewfinderPosition() {
  const viewfinder = document.getElementById("viewfinder");
  const videoWidth = parseInt(
    window.getComputedStyle(document.querySelector("#viewfinder video")).width,
    10
  );
  viewfinder.style.left = (document.documentElement.clientWidth - videoWidth) / 2 + "px";
}

function injectViewfinder() {
  const viewfinder = document.getElementById("viewfinder");
  const videoElement = camera.getVideoElement();
  console.log("adding video player");
  videoElement.style.width = "100px";
  viewfinder.appendChild(leftShutter);
  viewfinder.appendChild(videoElement);
  viewfinder.appendChild(rightShutter);
  adjustViewfinderPosition();

  window.addEventListener("resize", function () {
    adjustViewfinderPosition();
  });
}

// Tries to inject the viewfinder and returns true on success false otherwise
function tryToInjectViewfinder() {
  const viewfinder = document.getElementById("viewfinder");
  if (viewfinder) {
    injectViewfinder();
    console.log("Successfully injected viewfinder");
    return true;
  } else {
    console.log("failed to inject viewfinder");
    return false;
  }
}

function updateVhCssVariable() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", vh + "px");
}

export function executeManualDOMTasks() {
  //Try to inject the viewfinder till it works
  camera.getVideoElement().addEventListener("canplay", () => {
    const viewfinderTryHandle = setInterval(() => {
      if (tryToInjectViewfinder()) {
        clearInterval(viewfinderTryHandle);
      }
    }, 300);
  });

  //Update the --vh css variable
  window.addEventListener("resize", updateVhCssVariable);
  updateVhCssVariable();
}
