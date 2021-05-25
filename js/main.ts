import { initdb, db } from "./persistence";
import { app, Subscription } from "hyperapp";
import { rootComponent } from "./components";
import { UpdateTime } from "./actions";
import { CAMERA_PATH, CLICK_SOUND_FILE } from "./constants";
import { globalAudioPlayer } from "./media";
import { executeManualDOMTasks } from "./dom";
import { State } from "./types";

executeManualDOMTasks();

type IntervalPayload = {
  time: number;
  action: any;
};

const intervalSubscriber = (dispatch, { time, action }: IntervalPayload) => {
  let handle = setInterval(() => {
    dispatch(action);
  }, time);
  return () => clearInterval(handle);
};

const onInterval = (time, action): Subscription<State, IntervalPayload> => [
  intervalSubscriber,
  { time, action },
];

async function initApp() {
  await initdb();
  // window.pdb = db; //TODO: remove

  const [initialActiveFilm, initialFilmsInDevelopment] = await Promise.all([
    db.loadActiveFilm(),
    db.loadAllFilmsInDevelopment(),
    globalAudioPlayer.load(CLICK_SOUND_FILE),
  ]);

  app<State>({
    init: {
      activeFilm: initialActiveFilm,
      filmsInDevelopment: initialFilmsInDevelopment,
      galleryImages: [],
      path: CAMERA_PATH,
      currentTime: Date.now(),
      zeroDevelopmentTime: false,
      showVideoPermissionPopup: false,
      galleryDownloadInProgress: false,
    },
    view: (state) => {
      console.log("State before render is", state);
      return rootComponent(state);
    },
    node: document.getElementById("container"),
    subscriptions: (state) => (state.path === CAMERA_PATH ? [onInterval(10000, UpdateTime)] : []),
  });
}

initApp();
