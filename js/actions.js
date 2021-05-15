import { PhotoCamera, globalAudioPlayer } from "./media.js";
import { db } from "./persistence.js";
import { download, photoFileName } from "./utils.js";
import * as translator from "./translator.js";
import {
  CAMERA_PATH,
  ENABLE_VIEWFINDER,
  GALLERY_PATH,
  SHOP_PATH,
  CLICK_SOUND_FILE,
} from "./constants.js";

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

function injectViewfinder() {
  const viewfinder = document.getElementById("viewfinder");

  console.log("adding video player");
  videoElement.style.width = "100px";
  viewfinder.appendChild(camera.getVideoElement());

  adjustViewfinderPosition();

  window.addEventListener("resize", function () {
    adjustViewfinderPosition();
  });
}

// Tries to inject the viewfinder and returns true on success false otherwise
function tryToInjectViewfinder() {
  const viewfinder = document.getElementById("viewfinder");
  if (viewfinder) {
    injectViewfinder();
    console.log("Successfully injected viewfinder");
    return true;
  } else {
    console.log("failed to inject viewfinder");
    return false;
  }
}

if (ENABLE_VIEWFINDER) {
  videoElement.addEventListener("canplay", () => {
    const viewfinderTryHandle = setInterval(() => {
      if (tryToInjectViewfinder()) {
        clearInterval(viewfinderTryHandle);
      }
    }, 300);
  });
}

export const AskForVideoPermission = (state) => ({
  ...state,
  videoPermissionPopup: true,
});

export const GotVideoPermission = (state) => [
  { ...state, videoPermissionPopup: false },
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
        Promise.all([
          db.setActiveFilmId(newFilmId),
          db.loadFilm(newFilmId),
        ]).then(([, newFilm]) => {
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
      db.loadAllDevelopedPhotos().then((photos) => {
        dispatch(EnterGallery, photos);
      });
    },
  ],
];
