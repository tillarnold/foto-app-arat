/**
 * Represents a Camera used to take still photos and also exposes a Video elemetn that can be used to show a preview to the user.
 *
 * The overall flow of taking a photo is:
 *   1. Use getUserMedia to get a stream from the user's camera
 *   2. Create an HTML video element and set the source of the video element to the stream
 *      This video element can also be added to the document to show a preview to the user
 *   3. When a photo should be taken draw the current video frame from the video element to
 *      a canvas and convert the canvas to a a DataURL
 *
 *
 * There are a few complications that this class also adresses.
 * Of particular interest is that on some platforms the video element used is not allowed to
 * play as those platforms block autoplay. In such cases the isPlaying function will return false
 * and a message should be shown to the user. With the user action the forcePlay function can then
 * be called to allow the video to play.
 */
export function PhotoCamera() {
  const player = document.createElement("video");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let playing = false;

  player.playsInline = true; //Needed to show to viewfinder on iOS

  navigator.mediaDevices
    .getUserMedia({
      video: { facingMode: "environment" },
    })
    .then((stream) => {
      player.srcObject = stream;
      forcePlay();
    })
    .catch((err) => console.error("An error occurred while getting the camera stream:", err));

  player.addEventListener("canplay", adjustSize);
  window.addEventListener("resize", adjustSize);

  function adjustSize() {
    canvas.width = player.videoWidth;
    canvas.height = player.videoHeight;
  }

  /**
   * Takes a photo
   *
   * @returns {string} A picture as a DataUrl
   */
  function snap() {
    adjustSize();
    ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  function getVideoElement() {
    return player;
  }

  function forcePlay() {
    return player
      .play()
      .catch((e) => {
        console.log("error while playing video", e);
        playing = false;
        return e;
      })
      .then((e) => {
        console.log("Play video was successufull", e);
        playing = true;
        return e;
      });
  }

  return {
    snap,
    getVideoElement,
    forcePlay,
    isPlaying: () => playing,
  };
}

export function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  return fetch(url).then((response) => response.arrayBuffer());
}

export function fetchAudio(url: string, ctx: AudioContext) {
  return fetchArrayBuffer(url).then((buffer) => ctx.decodeAudioData(buffer));
}

export class AudioPlayer {
  disabled: boolean;
  audioContext: AudioContext;
  cache: Map<string, any>;

  constructor() {
    this.disabled = !("AudioContext" in window);
    if (!this.disabled) {
      this.audioContext = new AudioContext();
      this.cache = new Map();
      this.disabled = false;
    } else {
      console.warn("This device does not support AudioContext. Audio playback was disabled.");
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

  private getAudioBufferSourceNode(url) {

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
