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
  DisableZeroDevelopmentTime,
  EnableZeroDevelopmentTime,
} from "./actions.js";

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

const DEVELOPMENT_TIME = 0.5 * HOURS;

import { timeFormat } from "./utils.js";

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
    text(`There are currently ${filmsInDevelopment.length} films in the lab`),
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

  console.log(
    `The film started at ${new Date(
      film.developmentStartDate
    ).toLocaleTimeString()} is now done: ${isDone} and zeroDevelopmentTime is ${zeroDevelopmentTime}`
  );
  return h("li", { style: { marginBottom: "0.3rem" } }, [
    /*text(
      `The film was sent for development at ${new Date(
        film.developmentStartDate
      ).toLocaleString()}`
    ),*/
    isDone
      ? h(
          "button",
          {
            onclick: [DevelopedFilmWasCollected, film.id],
            class: "pickup-button",
          },
          text("Ready for pickup!")
        )
      : text(`The film will be ready in ${timeFormat(timeLeft)}`),
    ,
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
    h("p", {}, text("Gallery")),
    h("button", { class: "p-button", onclick: ExitGallery }, text("back")),
    galleryImagesList({ galleryImages }),
  ]);

export const shop = (state) =>
  h(
    "div",
    { class: "shop", style: { display: "flex", flexDirection: "column" } },
    [
      h("h1", {}, text("Shop")),
      h("div", { style: { flex: 1 } }, [
        state.zeroDevelopmentTime
          ? h(
              "button",
              { onclick: DisableZeroDevelopmentTime, class: "p-button" },
              text("Disable Instant development!")
            )
          : h(
              "button",
              { onclick: EnableZeroDevelopmentTime, class: "p-button" },
              text("Enable Instant development!")
            ),
      ]),
      h("button", { onclick: ExitShop, class: "p-button" }, text("Back")),
    ]
  );

export const camera = (state) =>
  h("div", { class: "camera" }, [
    h(
      "div",
      {
        class: "camera-top-panel",
      },
      [
        film_indicator(state),
        h("button", { onclick: TakePhoto, class: "snap-button" }),
      ]
    ),
    h("div", { class: "camera-bottom-panel" }, [
      h(
        "button",
        { class: "p-button", onclick: EnterMainGallery },
        text("Gallery")
      ),
      h("button", { class: "p-button", onclick: EnterShop }, text("Shop")),

      film_lab(state),
      h("br", {}),
      h("button", { class: "p-button", onclick: ResetDb }, text("RESET")),
    ]),
  ]);
