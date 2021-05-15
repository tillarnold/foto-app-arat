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
} from "./actions.js";
import * as translator from "./translator.js";

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

const DEVELOPMENT_TIME = 0.5 * HOURS;

export const film_indicator = ({ activeFilm }) =>
  h("div", { class: "film-state" }, [
    ...Array.from({ length: activeFilm.photos.length }, () =>
      h("div", { class: "photo-in-film-used" })
    ),
    ...Array.from(
      { length: activeFilm.frames - activeFilm.photos.length },
      () => h("div", { class: "photo-in-film-free" })
    ),
  ]);

export const film_lab = ({
  filmsInDevelopment,
  zeroDevelopmentTime,
  currentTime,
}) =>
  h("div", { style: { marginTop: "1rem" } }, [
    text(translator.nrOfFilmsInLab(filmsInDevelopment.length)),
    h(
      "ul",
      { style: { paddingLeft: "1rem", lineHeight: "2", marginTop: "0.5rem" } },
      filmsInDevelopment.map((film) =>
        film_lab_item(film, zeroDevelopmentTime, currentTime)
      )
    ),
  ]);

export const film_lab_item = (film, zeroDevelopmentTime, currentTime) => {
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
        class: "gallery-photo",
        onclick: [DownloadPhoto, photo],
      })
    )
  );

export const gallery = ({ galleryImages }) =>
  h("div", { class: "gallery" }, [
    h("p", {}, text(translator.gallery())),
    h(
      "button",
      { class: "p-button", onclick: ExitGallery },
      text(translator.back())
    ),
    galleryImagesList({ galleryImages }),
  ]);

export const shop = (state) =>
  h(
    "div",
    { class: "shop", style: { display: "flex", flexDirection: "column" } },
    [
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
      ]),
      h(
        "button",
        { onclick: ExitShop, class: "p-button" },
        text(translator.back())
      ),
    ]
  );

export const camera = (state) =>
  h("div", { class: "camera" }, [
    h(
      "div",
      {
        class: "camera__top-panel",
      },
      [
        film_indicator(state),
        h("button", { onclick: TakePhoto, class: "snap-button" }),
      ]
    ),
    h("div", { class: "camera__bottom-panel" }, [
      h("div", { class: "camera__info-area" }, [film_lab(state)]),

      h("div", { class: "camera__button-bar" }, [
        h(
          "button",
          { class: "p-button", onclick: EnterMainGallery },
          text(translator.gallery())
        ),
        h(
          "button",
          { class: "p-button", onclick: EnterShop },
          text(translator.shop())
        ),
        h("button", { class: "p-button", onclick: ResetDb }, text("RESET")),
      ]),
    ]),
  ]);
