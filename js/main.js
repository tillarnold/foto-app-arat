import { initdb, db } from "./persistence.js";
import { app } from "./vendor/hyperapp-2.0.18.js";
import { rootComponent } from "./components.js";
import { UpdateTime } from "./actions.js";
import { CAMERA_PATH, CLICK_SOUND_FILE } from "./constants.js";
import { globalAudioPlayer } from "./media.js";
import { executeManualDOMTasks } from "./dom.js";

executeManualDOMTasks();

const intervalSubscriber = (dispatch, { time, action }) => {
  let handle = setInterval(() => {
    dispatch(action);
  }, time);
  return () => clearInterval(handle);
};

const onInterval = (time, action) => [intervalSubscriber, { time, action }];

async function initApp() {
  await initdb();
  window.pdb = db; //TODO: remove

  const [initialActiveFilm, initialFilmsInDevelopment] = await Promise.all([
    db.loadActiveFilm(),
    db.loadAllFilmsInDevelopment(),
    globalAudioPlayer.load(CLICK_SOUND_FILE),
  ]);

  app({
    init: {
      activeFilm: initialActiveFilm,
      filmsInDevelopment: initialFilmsInDevelopment,
      galleryImages: [],
      path: CAMERA_PATH,
      currentTime: Date.now(),
      zeroDevelopmentTime: false,
      showVideoPermissionPopup: false,
    },
    view: (state) => {
      console.log("State before render is", state);
      return rootComponent(state);
    },
    node: document.getElementById("container"),
    subscriptions: (state) => [state.path === CAMERA_PATH && onInterval(10000, UpdateTime)],
  });
}

initApp();
