import { globalAudioPlayer } from "./media.js";
import { db, Film, Photo } from "./persistence.js";
import { download, photoFileName, shareDownload } from "./utils.js";
import * as translator from "./translator.js";
import { CLICK_SOUND_FILE } from "./constants.js";
import { camera, closeAndOpenShutter } from "./dom.js";
import { Path, State } from "./types.js";
import { Dispatchable } from "hyperapp";

export const AskForVideoPermission = (state: State): Dispatchable<State> => ({
  ...state,
  showVideoPermissionPopup: true,
});

export const GotVideoPermission = (state: State): Dispatchable<State> => [
  { ...state, showVideoPermissionPopup: false },
  [
    () => {
      camera.forcePlay();
    },
  ],
];

export const TakePhoto = (state: State): Dispatchable<State> => [
  state,
  [
    (dispatch) => {
      if (!camera.isPlaying()) {
        dispatch(AskForVideoPermission);
        return;
      }

      const pic = camera.snap();
      closeAndOpenShutter();
      globalAudioPlayer.play(CLICK_SOUND_FILE);
      db.addPhotoToActiveFilm(pic).then((film) => {
        dispatch(NewPhotoTaken, film);
      });
    },
  ],
];

export const DownloadPhoto = (state: State, photo: Photo): Dispatchable<State> => [
  state,
  [
    () => {
      photoFileName(photo).then((name) => {
        download(photo, name);
      });
    },
  ],
];

export const FilmsInDevelopmentChanged = (
  state: State,
  filmsInDevelopment: Film[]
): Dispatchable<State> => {
  return {
    ...state,
    filmsInDevelopment,
  };
};

export const ResetDb = (state: State): Dispatchable<State> => [
  state,
  [
    () => {
      if (window.confirm(translator.deleteDatabaseConfirmation())) {
        db.deleteDatabase();
        window.location.reload();
      }
    },
  ],
];

export const NewFilmWasInserted = (state: State, newFilm: Film): Dispatchable<State> => ({
  ...state,
  activeFilm: newFilm,
});

export const UpdateTime = (state: State): Dispatchable<State> => ({
  ...state,
  currentTime: Date.now(),
});

export const ChangeZeroDevelopmentMode = (state: State, event: any): Dispatchable<State> => ({
  ...state,
  zeroDevelopmentTime: event.target.checked,
});

export const NewPhotoTaken = (state: State, film: Film): Dispatchable<State> => [
  {
    ...state,
    activeFilm: film,
  },
  film.photos.length >= film.frames && [
    (dispatch) => {
      db.addFilm().then((newFilmId) => {
        Promise.all([db.setActiveFilmId(newFilmId), db.loadFilm(newFilmId)]).then(([, newFilm]) => {
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

export const DevelopedFilmWasCollected = (state: State, filmId: number): Dispatchable<State> => [
  {
    ...state,
  },
  [
    (dispatch) => {
      db.developFilm(filmId).then((developedFilm) => {
        db.loadAllFilmsInDevelopment().then((films) => {
          dispatch(FilmsInDevelopmentChanged, films);
        });
        Promise.all(developedFilm.photos.map((photoId) => db.loadPhoto(photoId))).then((photos) =>
          dispatch(EnterGallery, photos)
        );
      });
    },
  ],
];

export const EnterGallery = (state: State, galleryImages: Photo[]): Dispatchable<State> => ({
  ...state,
  path: Path.Gallery,
  galleryImages,
});

export const ExitGallery = (state: State): Dispatchable<State> => ({
  ...state,
  path: Path.Camera,
});

export const AddPhotoToGallery = (state: State, { photo, index }): Dispatchable<State> => {
  let newGalleryImages = [...state.galleryImages];
  newGalleryImages[index] = photo;
  return { ...state, galleryImages: newGalleryImages };
};

export const EnterShop = (state: State): Dispatchable<State> => ({
  ...state,
  path: Path.Shop,
});

export const ExitShop = (state: State): Dispatchable<State> => ({
  ...state,
  path: Path.Camera,
});

export const EnterMainGallery = (state: State): Dispatchable<State> => [
  { ...state },
  [
    (dispatch) => {
      db.loadDevelopedPhotoIds().then((photoIds) => {
        dispatch(EnterGallery, new Array(photoIds.length));
        photoIds.forEach((photoId, index) => {
          db.loadPhoto(photoId).then((photo) => dispatch(AddPhotoToGallery, { index, photo }));
        });
      });
    },
  ],
];

export const DownloadGalleryDone = (state: State): Dispatchable<State> => ({
  ...state,
  galleryDownloadInProgress: false,
});

export const StartDownloadGallery = (state: State): Dispatchable<State> => [
  { ...state, galleryDownloadInProgress: true },
  [
    (dispatch) => {
      db.loadAllDevelopedPhotos().then((photos) => {
        shareDownload(photos).then(() => dispatch(DownloadGalleryDone));
      });
    },
  ],
];
