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
} from "./actions.js";

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

export const film_lab = ({ filmsInDevelopment }) =>
  h("div", {}, [
    text(`There are currently ${filmsInDevelopment.length} films in the lab`),
    h("ul", {}, filmsInDevelopment.map(film_lab_item)),
  ]);

export const film_lab_item = (film) =>
  h("li", {}, [
    text(
      `The film was sent for development at ${new Date(
        film.developmentStartDate
      ).toLocaleString()}`
    ),
    h("button", { onclick: [DevelopedFilmWasCollected, film.id] }, text("Get")),
  ]);

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

export const shop = () =>
  h("div", { class: "shop" }, [
    h("h1", {}, text("Shop")),
    h("button", { onclick: ExitShop, class: "p-button" }, text("Back")),
  ]);

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
