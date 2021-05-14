import { h, text } from "./vendor/hyperapp-2.0.18.js"
import { DevelopedFilmWasCollected, ExitGallery } from './actions.js'

export const film_indicator = ({ activeFilm }) => h("div", { class: "film-state" }, [
    ...Array.from({ length: activeFilm.photos.length }, () => h("div", { class: "photo-in-film-used" })),
    ...Array.from({ length: activeFilm.frames - activeFilm.photos.length }, () => h("div", { class: "photo-in-film-free" })),
]);

export const film_lab = ({ filmsInDevelopment }) => h("div", {}, [
    text(`There are currently ${filmsInDevelopment.length} films in the lab`),
    h("ul", {},
        filmsInDevelopment.map(film_lab_item)
    )
]);

export const film_lab_item = film => h("li", {}, [
    text(`The film was sent for development at ${new Date(film.developmentStartDate).toLocaleString()}`),
    h("button", { onclick: [DevelopedFilmWasCollected, film.id] }, text("Get"))
]);


export const galleryImagesList = ({ galleryImages }) => h("div", {},
    galleryImages.map(photo => h("img", { src: photo, class: "gallery-photo" }))
)


export const gallery = ({ galleryImages }) => h("div", {class: "gallery"}, [
    h("p", {}, text("Gallery")),
    h("button", { onclick: ExitGallery }, text("back")),
    galleryImagesList({ galleryImages }),
]);