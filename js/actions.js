import { PhotoCamera } from "./camera.js";
import { db } from "./persistence.js";
import { download } from "./utils.js";

const camera = PhotoCamera();

export const TakePhoto = (state) => [
  { ...state },
  [
    (dispatch) => {
      const pic = camera.snap();
      db.addPhotoToActiveFilm(pic).then((film) => {
        dispatch(NewPhotoTaken, film);
      });
    },
  ],
];

export const DownloadPhoto = (state, photo) => [
  { ...state },
  [
    (dispatch) => {
      download(photo);
    },
  ],
];

export const FilmsInDevelopmentChanged = (state, filmsInDevelopment) => {
  console.log("FilmsInDevelopmentChanged", { state, filmsInDevelopment });
  return {
    ...state,
    filmsInDevelopment,
  };
};

export const ResetDb = (state) => [
  {
    ...state,
  },
  [
    (dispatch) => {
      db.deleteDatabase();
      window.location.reload();
    },
  ],
];

ResetDb;

export const NewFilmWasInserted = (state, newFilm) => ({
  ...state,
  activeFilm: newFilm,
});

export const NewPhotoTaken = (state, film) => [
  {
    ...state,
    activeFilm: film,
  },
  film.photos.length >= film.frames && [
    (dispatch) => {
      db.addFilm().then((newFilmId) => {
        Promise.all([
          db.setActiveFilmId(newFilmId),
          db.loadFilm(newFilmId),
        ]).then(([_, newFilm]) => {
          console.log("new film is ", newFilm, "because old film was", film);
          dispatch(NewFilmWasInserted, newFilm);
          db.addDevelopmentStartTimeStampToFilm(film.id, Date.now()).then(() =>
            db.loadAllFilmsInDevelopment().then((films) => {
              dispatch(FilmsInDevelopmentChanged, films);
            })
          );
        });
      });
    },
  ],
];

export const DevelopedFilmWasCollected = (state, filmId) => [
  {
    ...state,
  },
  [
    (dispatch) => {
      db.developFilm(filmId).then((developedFilm) => {
        db.loadAllFilmsInDevelopment().then((films) => {
          dispatch(FilmsInDevelopmentChanged, films);
        });
        Promise.all(developedFilm.photos.map(db.loadPhoto)).then((photos) =>
          dispatch(EnterGallery, photos)
        );
      });
    },
  ],
];
/*
export const NewPhotoTaken = db => (state, film) => [{
    ...state,
    usedFrames: film.photos.length
}, [film.photos.length >= film.frames && (dispatch => {
    db.developActiveFilm().then(film => {
        dispatch(FilmWasDeveloped(db), film)
    })
})]]
*/

export const EnterGallery = (state, galleryImages) => ({
  ...state,
  path: "gallery",
  galleryImages,
});

export const ExitGallery = (state) => ({
  ...state,
  path: "camera",
});

export const EnterShop = (state) => ({
  ...state,
  path: "shop",
});

export const ExitShop = (state) => ({
  ...state,
  path: "camera",
});

export const EnterMainGallery = (state) => [
  { ...state },
  [
    (dispatch) => {
      db.loadAllDevelopedPhotos().then((photos) => {
        dispatch(EnterGallery, photos);
      });
    },
  ],
];
