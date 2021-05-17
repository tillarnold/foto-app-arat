import { h, text } from "./vendor/hyperapp-2.0.18.js";
import {
  DevelopedFilmWasCollected,
  ExitGallery,
  DownloadPhoto,
  ExitShop,
  EnterMainGallery,
  TakePhoto,
  ResetDb,
  EnterShop,
  ChangeZeroDevelopmentMode,
  GotVideoPermission,
  AskForVideoPermission,
} from "./actions.js";
import * as translator from "./translator.js";
import { GALLERY_PATH, SHOP_PATH } from "./constants.js";

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

const DEVELOPMENT_TIME = 0.5 * HOURS;

export const rootComponent = (state) =>
  h("main", { style: { overflow: "hidden" } }, [
    h(
      "div",
      {
        class: "camera-and-shop",
        style: {
          marginTop: state.path === GALLERY_PATH ? "calc(var(--vh, 1vh) * -100)" : "0",
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

export const camera = (state) =>
  h("div", { class: "camera" }, [
    h(
      "div",
      {
        class: "camera__top-panel",
      },
      [filmIndicator(state), h("button", { onclick: TakePhoto, class: "snap-button" })]
    ),
    h("div", { class: "camera__bottom-panel" }, [
      h("div", { class: "camera__info-area" }, [filmLab(state)]),

      h("div", { class: "camera__button-bar" }, [
        h("button", { class: "p-button", onclick: EnterMainGallery }, text(translator.gallery())),
        h("button", { class: "p-button", onclick: EnterShop }, text(translator.shop())),
        h("button", { class: "p-button", onclick: ResetDb }, text("RESET")),
      ]),
    ]),
  ]);

export const filmIndicator = ({ activeFilm }) =>
  h("div", { class: "film-state" }, [
    ...Array.from({ length: activeFilm.photos.length }, () =>
      h("div", { class: "photo-in-film-used" })
    ),
    ...Array.from({ length: activeFilm.frames - activeFilm.photos.length }, () =>
      h("div", { class: "photo-in-film-free" })
    ),
  ]);

export const filmLab = ({ filmsInDevelopment, zeroDevelopmentTime, currentTime }) =>
  h("div", { style: { marginTop: "1rem" } }, [
    text(translator.nrOfFilmsInLab(filmsInDevelopment.length)),
    h(
      "ul",
      { style: { paddingLeft: "1rem", lineHeight: "2", marginTop: "0.5rem" } },
      filmsInDevelopment.map((film) => filmLabItem(film, zeroDevelopmentTime, currentTime))
    ),
  ]);

export const filmLabItem = (film, zeroDevelopmentTime, currentTime) => {
  const timeInDevelopment = currentTime - film.developmentStartDate;
  const timeLeft = DEVELOPMENT_TIME - timeInDevelopment;
  let isDone = timeLeft <= 0;

  if (zeroDevelopmentTime) {
    isDone = true;
  }

  return h("li", { style: { marginBottom: "0.3rem" } }, [
    isDone
      ? h(
          "button",
          {
            onclick: [DevelopedFilmWasCollected, film.id],
            class: "pickup-button",
          },
          text(translator.readyForPickup())
        )
      : text(translator.filmReadyIn(timeLeft)),
  ]);
};

export const galleryImagesList = ({ galleryImages }) =>
  h(
    "div",
    {},
    galleryImages.map((photo) =>
      h("img", {
        src: photo,
        class: "gallery__photo",
        onclick: [DownloadPhoto, photo],
      })
    )
  );

export const gallery = ({ galleryImages }) =>
  h("div", { class: "gallery" }, [
    h("p", {}, text(translator.gallery())),
    h("button", { class: "p-button", onclick: ExitGallery }, text(translator.back())),
    galleryImagesList({ galleryImages }),
  ]);

export const shop = (state) =>
  h("div", { class: "shop", style: { display: "flex", flexDirection: "column" } }, [
    h("h1", {}, text(translator.shop())),
    h("div", { style: { flex: 1 } }, [
      h("label", { style: { display: "flex" } }, [
        text(translator.instantDevelopmentMode()),
        h("input", {
          style: { marginLeft: "1rem" },
          type: "checkbox",
          checked: state.zeroDevelopmentTime,
          onchange: ChangeZeroDevelopmentMode,
        }),
      ]),
      debugView(state),
      h("button", { onclick: AskForVideoPermission, class: "p-button" }, text("popuptest")),
    ]),
    h("button", { onclick: ExitShop, class: "p-button" }, text(translator.back())),
  ]);

export const debugView = ({ filmsInDevelopment, activeFilm }) =>
  h(
    "details",
    {
      style: {
        border: "1px solid #aaa",
        borderRadius: "4px",
        padding: ".5em .5em 0",
      },
    },
    [
      h(
        "summary",
        {
          style: {
            fontWeight: "bold",
            margin: "-.5em -.5em 0",
            padding: ".5em",
          },
        },
        text("Debug")
      ),
      h("pre", {}, text(JSON.stringify({ filmsInDevelopment, activeFilm }, null, 2))),
    ]
  );

export const videoPermissionPopup = (showVideoPermissionPopup) =>
  h(
    "div",
    {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: showVideoPermissionPopup ? "rgba(0.3,0.3,0.3,0.6)" : "transparent",
        transition: "0.3s",
        pointerEvents: showVideoPermissionPopup ? "auto" : "none",
      },
    },
    [
      h(
        "div",
        {
          style: {
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: "1rem",
            borderRadius: "3px",
            marginTop: showVideoPermissionPopup ? 0 : "-200vh",
            transition: "0.5s margin",
          },
        },
        [
          text(translator.pleaseAllowVideoPlayback()),
          h("button", { class: "p-button", onclick: GotVideoPermission }, text(translator.allow())),
        ]
      ),
    ]
  );
