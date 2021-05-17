import { PhotoCamera } from "./media.js";

export const camera = PhotoCamera();

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
  viewfinder.appendChild(videoElement);

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
