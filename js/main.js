import { initdb, db } from "./persistence.js";
import { h, app } from "./vendor/hyperapp-2.0.18.js";
import { gallery, shop, camera } from "./components.js";
import { UpdateTime } from "./actions.js";

const intervalSubscriber = (dispatch, { time, action }) => {
  let handle = setInterval(() => {
    dispatch(action);
  }, time);
  return () => clearInterval(handle);
};

const onInterval = (time, action) => [intervalSubscriber, { time, action }];

initdb(() => {
  window.pdb = db; //TODO: remove
  Promise.all([db.loadActiveFilm(), db.loadAllFilmsInDevelopment()]).then(
    ([initialActiveFilm, initialFilmsInDevelopment]) => {
      app({
        init: {
          activeFilm: initialActiveFilm,
          filmsInDevelopment: initialFilmsInDevelopment,
          galleryImages: [],
          path: "camera",
          currentTime: Date.now(),
          zeroDevelopmentTime: false,
        },
        view: (state) => {
          console.log("State before render is", state);
          return h("main", {}, [
            h(
              "div",
              {
                class: "camera-and-shop",
                style: {
                  marginTop: state.path === "gallery" ? "-100vh" : "0",
                  marginLeft: state.path === "shop" ? "-100vw" : "0",
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
          ]);
        },
        node: document.getElementById("container"),
        subscriptions: (state) => [
          state.path === "camera" && onInterval(10000, UpdateTime),
        ],
      });
    }
  );
});
