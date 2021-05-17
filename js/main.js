import { initdb, db } from "./persistence.js";
import { h, app } from "./vendor/hyperapp-2.0.18.js";
import { gallery, shop, camera, videoPermissionPopup } from "./components.js";
import { UpdateTime } from "./actions.js";
import { CAMERA_PATH, GALLERY_PATH, SHOP_PATH, CLICK_SOUND_FILE } from "./constants.js";
import { globalAudioPlayer } from "./media.js";

window.addEventListener("resize", () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", vh + "px");
});

const intervalSubscriber = (dispatch, { time, action }) => {
  let handle = setInterval(() => {
    dispatch(action);
  }, time);
  return () => clearInterval(handle);
};

const onInterval = (time, action) => [intervalSubscriber, { time, action }];

initdb(() => {
  window.pdb = db; //TODO: remove
  Promise.all([
    db.loadActiveFilm(),
    db.loadAllFilmsInDevelopment(),
    globalAudioPlayer.load(CLICK_SOUND_FILE),
  ]).then(([initialActiveFilm, initialFilmsInDevelopment]) => {
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
        return h("main", { style: { overflow: "hidden" } }, [
          h(
            "div",
            {
              class: "camera-and-shop",
              style: {
                marginTop: state.path === GALLERY_PATH ? "-100vh" : "0",
                marginLeft: state.path === SHOP_PATH ? "-100vw" : "0",
                position: "relative",
              },
            },
            [
              h("div", {
                id: "viewfinder",
                style: {
                  position: "absolute",
                  top: "0",
                },
              }),
              camera(state),
              shop(state),
            ]
          ),
          gallery(state),
          videoPermissionPopup(state.showVideoPermissionPopup),
        ]);
      },
      node: document.getElementById("container"),
      subscriptions: (state) => [state.path === CAMERA_PATH && onInterval(10000, UpdateTime)],
    });
  });
});
