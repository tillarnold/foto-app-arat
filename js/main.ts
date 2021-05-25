import { initdb, db, Film } from "./persistence";
import { Action, app, Dispatch, Dispatchable, Subscription } from "hyperapp";
import { rootComponent } from "./components";
import { UpdateTime } from "./actions";
import { CLICK_SOUND_FILE } from "./constants";
import { globalAudioPlayer } from "./media";
import { executeManualDOMTasks } from "./dom";
import { Path, State } from "./types";

executeManualDOMTasks();

type IntervalPayload = {
  time: number;
  action: Action<State>;
};

const intervalSubscriber = (dispatch: Dispatch<State>, { time, action }: IntervalPayload) => {
  let handle = setInterval(() => {
    dispatch(action);
  }, time);
  return () => clearInterval(handle);
};

const onInterval = (time: number, action: Action<State>): Subscription<State, IntervalPayload> => [
  intervalSubscriber,
  { time, action },
];

async function initApp() {
  await initdb();
  // window.pdb = db; //TODO: remove

  const [initialActiveFilm, initialFilmsInDevelopment]: [Film, Film[], any] = await Promise.all([
    db.loadActiveFilm(),
    db.loadAllFilmsInDevelopment(),
    globalAudioPlayer.load(CLICK_SOUND_FILE),
  ]);

  app<State>({
    init: {
      activeFilm: initialActiveFilm,
      filmsInDevelopment: initialFilmsInDevelopment,
      galleryImages: [],
      path: Path.Camera,
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
    subscriptions: (state) => (state.path === Path.Camera ? [onInterval(10000, UpdateTime)] : []),
  });
}

initApp();
