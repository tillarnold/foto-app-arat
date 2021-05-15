export function PhotoCamera() {
  const player = document.createElement("video");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  player.playsInline = true; //Needed to show to viewfinder on iOS

  navigator.mediaDevices
    .getUserMedia({
      video: { facingMode: "environment" },
    })
    .then((stream) => {
      player.srcObject = stream;
      forcePlay();
    })
    .catch((err) =>
      console.error("An error occurred while getting the camera stream:", err)
    );

  player.addEventListener("canplay", () => {
    canvas.width = player.videoWidth;
    canvas.height = player.videoHeight;
  });

  function snap() {
    ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  function getVideoElement() {
    return player;
  }

  function forcePlay() {
    player
      .play()
      .catch((e) => console.log("error while playing video", e))
      .then((e) => console.log("Play video was successufull", e));
  }

  return {
    snap,
    getVideoElement,
    forcePlay,
  };
}

export function fetchArrayBuffer(url) {
  return fetch(url).then((response) => response.arrayBuffer());
}

export function fetchAudio(url, ctx) {
  return fetchArrayBuffer(url).then((buffer) => ctx.decodeAudioData(buffer));
}

export class AudioPlayer {
  constructor() {
    this.disabled = !("AudioContext" in window);
    if (!this.disabled) {
      this.audioContext = new AudioContext();
      this.cache = new Map();
      this.disabled = false;
    } else {
      console.warn(
        "This device does not support AudioContext. Audio playback was disabled."
      );
    }
  }

  load(url) {
    if (this.disabled) {
      return Promise.resolve(new Error("AudioContext not supported"));
    }
    return fetchAudio(url, this.audioContext).then((result) => {
      this.cache.set(url, result);
      return result;
    });
  }

  /// Returns the audio buffer at that url or an empty buffer if it is not loaded yet
  get(url) {
    if (this.disabled) {
      return Promise.resolve(new Error("AudioContext not supported"));
    }
    if (this.cache.has(url)) {
      return this.cache.get(url);
    } else {
      this.load(url);
      console.warn("[AudioPlayer] tried to play non-loaded sound");
      return this.audioContext.createBuffer(2, 22050, 44100);
    }
  }

  getAudioBufferSourceNode(url) {
    if (this.disabled) {
      return new Error("AudioContext not supported");
    }
    const source = this.audioContext.createBufferSource();
    source.buffer = this.get(url);
    source.connect(this.audioContext.destination);
    return source;
  }

  play(url) {
    if (this.disabled) {
      return new Error("AudioContext not supported");
    }
    const source = this.getAudioBufferSourceNode(url);
    source.start(0);
    return source;
  }

  loop(url) {
    if (this.disabled) {
      return new Error("AudioContext not supported");
    }
    const source = this.getAudioBufferSourceNode(url);
    source.loop = true;
    source.start(0);
    return source;
  }
}

export const globalAudioPlayer = new AudioPlayer();
