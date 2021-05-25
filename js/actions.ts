import { globalAudioPlayer } from "./media.js";
import { db } from "./persistence.js";
import { download, photoFileName, shareDownload } from "./utils.js";
import * as translator from "./translator.js";
import { CAMERA_PATH, GALLERY_PATH, SHOP_PATH, CLICK_SOUND_FILE } from "./constants.js";
import { camera, closeAndOpenShutter } from "./dom.js";

export const AskForVideoPermission = (state) => ({
  ...state,
  showVideoPermissionPopup: true,
});

export const GotVideoPermission = (state) => [
  { ...state, showVideoPermissionPopup: false },
  [
    () => {
      camera.forcePlay();
    },
  ],
];

export const TakePhoto = (state) => [
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

export const DownloadPhoto = (state, photo) => [
  state,
  [
    () => {
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
    () => {
      if (window.confirm(translator.deleteDatabaseConfirmation())) {
        db.deleteDatabase();
        window.location.reload();
      }
    },
  ],
];

export const NewFilmWasInserted = (state, newFilm) => ({
  ...state,
  activeFilm: newFilm,
});

export const UpdateTime = (state) => ({
  ...state,
  currentTime: Date.now(),
});

export const ChangeZeroDevelopmentMode = (state, event) => ({
  ...state,
  zeroDevelopmentTime: event.target.checked,
});

export const NewPhotoTaken = (state, film) => [
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

export const EnterGallery = (state, galleryImages) => ({
  ...state,
  path: GALLERY_PATH,
  galleryImages,
});

export const ExitGallery = (state) => ({
  ...state,
  path: CAMERA_PATH,
});

export const AddPhotoToGallery = (state, { photo, index }) => {
  let newGalleryImages = [...state.galleryImages];
  newGalleryImages[index] = photo;
  return { ...state, galleryImages: newGalleryImages };
};

export const EnterShop = (state) => ({
  ...state,
  path: SHOP_PATH,
});

export const ExitShop = (state) => ({
  ...state,
  path: CAMERA_PATH,
});

export const EnterMainGallery = (state) => [
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

export const DownloadGalleryDone = (state) => ({
  ...state,
  galleryDownloadInProgress: false,
});

export const StartDownloadGallery = (state) => [
  { ...state, galleryDownloadInProgress: true },
  [
    (dispatch) => {
      db.loadAllDevelopedPhotos().then((photos) => {
        shareDownload(photos).then(() => dispatch(DownloadGalleryDone));
      });
    },
  ],
];
