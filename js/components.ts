import { h, StyleProp, text, VNode } from "hyperapp";
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
  StartDownloadGallery,
} from "./actions.js";
import * as translator from "./translator.js";
import { GALLERY_PATH, SHOP_PATH } from "./constants.js";
import { State } from "./types.js";

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

const DEVELOPMENT_TIME = 0.5 * HOURS;

export const rootComponent = (state: State): VNode<State> =>
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

export const camera = (state: State): VNode<State> =>
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
        h("button", { class: "p-button", onclick: EnterMainGallery }, [text(translator.gallery())]),
        h("button", { class: "p-button", onclick: EnterShop }, [text(translator.shop())]),
        h("button", { class: "p-button", onclick: ResetDb }, [text("RESET")]),
      ]),
    ]),
  ]);

export const filmIndicator = ({ activeFilm }): VNode<any> =>
  h("div", { class: "film-state" }, [
    ...Array.from({ length: activeFilm.photos.length }, () =>
      h("div", { class: "photo-in-film-used" })
    ),
    ...Array.from({ length: activeFilm.frames - activeFilm.photos.length }, () =>
      h("div", { class: "photo-in-film-free" })
    ),
  ]);

export const filmLab = ({ filmsInDevelopment, zeroDevelopmentTime, currentTime }): VNode<State> =>
  h("div", { style: { marginTop: "1rem" } }, [
    text(translator.nrOfFilmsInLab(filmsInDevelopment.length)),
    h(
      "ul",
      { style: { paddingLeft: "1rem", lineHeight: "2", marginTop: "0.5rem" } },
      filmsInDevelopment.map((film) => filmLabItem(film, zeroDevelopmentTime, currentTime))
    ),
  ]);

export const filmLabItem = (film, zeroDevelopmentTime, currentTime): VNode<State> => {
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
            class: "p-button",
          },
          [text(translator.readyForPickup())]
        )
      : text(translator.filmReadyIn(timeLeft)),
  ]);
};

export const galleryImagesList = ({ galleryImages }): VNode<State> =>
  h(
    "div",
    { class: "p-card", style: { marginBottom: "1rem" } },
    galleryImages.map((photo) =>
      h("img", {
        src: photo,
        class: "gallery__photo",
        onclick: [DownloadPhoto, photo],
      })
    )
  );

export const gallery = ({ galleryImages, galleryDownloadInProgress }): VNode<State> =>
  h("div", { class: "gallery" }, [
    h("div", { class: "p-card flex-row", style: { alignItems: "center", marginBottom: "1rem" } }, [
      h("h3", { style: { flex: "1" } }, [text(translator.gallery())]),
      h("button", { class: "p-button", onclick: StartDownloadGallery }, [
        text(translator.downloadAll()),
        galleryDownloadInProgress && h("div", { class: "p-spinner" }),
      ]),
      h("button", { class: "p-button", onclick: ExitGallery }, [text(translator.back())]),
    ]),
    galleryImagesList({ galleryImages }),
  ]);

export const shop = (state: State): VNode<State> =>
  h("div", { class: "shop flex-column" }, [
    h("h1", {}, [text(translator.shop())]),
    h("div", { style: { flex: "1" } }, [
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
      h("button", { onclick: AskForVideoPermission, class: "p-button" }, [text("popuptest")]),
    ]),
    h("button", { onclick: ExitShop, class: "p-button" }, [text(translator.back())]),
  ]);

export const debugView = ({ filmsInDevelopment, activeFilm }): VNode<State> =>
  h(
    "details",
    {
      class: "p-card",
      style: { margin: "1rem 0" },
    },
    [
      h(
        "summary",
        {
          style: {
            fontWeight: "bold",
          },
        },
        [text("Debug")]
      ),
      h("pre", {}, [text(JSON.stringify({ filmsInDevelopment, activeFilm }, null, 2))]),
    ]
  );

export const videoPermissionPopup = (showVideoPermissionPopup): VNode<State> =>
  h(
    "div",
    {
      class: "flex-column",
      style: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100vw",
        height: "calc(var(--vh, 1vh) * 100)",
        alignItems: "center",
        justifyContent: "center",
        background: showVideoPermissionPopup ? "rgba(0.3,0.3,0.3,0.6)" : "transparent",
        transition: "0.3s",
        pointerEvents: showVideoPermissionPopup ? "auto" : "none",
      },
    },
    [
      h(
        "div",
        {
          class: "p-card flex-column",
          style: {
            padding: "2rem",
            marginTop: showVideoPermissionPopup ? "0" : "-200vh",
            transform: "scale(" + (showVideoPermissionPopup ? "1" : "0.3") + ")",
            "--movingTime": "0.3s",
            "--transformingTime": "0.1s",
            transition: showVideoPermissionPopup
              ? "margin var(--movingTime) 0s, transform var(--transformingTime) var(--movingTime)"
              : "margin var(--movingTime) var(--transformingTime), transform var(--transformingTime) 0s",
          } as StyleProp,
        },
        [
          h("p", { style: { paddingBottom: "2rem" } }, [
            text(translator.pleaseAllowVideoPlayback()),
          ]),
          h("button", { class: "p-button primary", onclick: GotVideoPermission }, [
            text(translator.allow()),
          ]),
        ]
      ),
    ]
  );
