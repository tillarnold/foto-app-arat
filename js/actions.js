import { PhotoCamera } from "./camera.js";
import { db } from "./persistence.js";
import { download, photoFileName } from "./utils.js";

const camera = PhotoCamera();

const videoElement = camera.getVideoElement();

function adjustViewfinderPosition() {
  const viewfinder = document.getElementById("viewfinder");
  const videoWidth = parseInt(
    window.getComputedStyle(document.querySelector("#viewfinder video")).width,
    10
  );
  viewfinder.style.left =
    (document.documentElement.clientWidth - videoWidth) / 2 + "px";
}

videoElement.addEventListener("canplay", (ev) => {
  console.log("adding video player");
  videoElement.style.width = "100px";
  const viewfinder = document.getElementById("viewfinder");
  viewfinder.appendChild(camera.getVideoElement());
  adjustViewfinderPosition();
});

window.addEventListener("resize", function (event) {
  adjustViewfinderPosition();
});

export const TakePhoto = (state) => [
  state,
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
  state,
  [
    (dispatch) => {
      photoFileName(photo).then((name) => {
        download(photo, name);
      });
    },
  ],
];

export const FilmsInDevelopmentChanged = (state, filmsInDevelopment) => {
  return {
    ...state,
    filmsInDevelopment,
  };
};

export const ResetDb = (state) => [
  state,
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

export const UpdateTime = (state) => ({
  ...state,
  currentTime: Date.now(),
});

export const DisableZeroDevelopmentTime = (state) => ({
  ...state,
  zeroDevelopmentTime: false,
});

export const EnableZeroDevelopmentTime = (state) => ({
  ...state,
  zeroDevelopmentTime: true,
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
