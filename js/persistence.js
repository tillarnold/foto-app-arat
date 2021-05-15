export function PhotoDB(cb) {
  const DB_NAME = "Foto-App-Arat";
  const PHOTO_STORE = "photos";
  const FILM_STORE = "films";
  const CONFIG_STORE = "config";

  const ACTIVE_FILM_CONFIG_KEY = "active_film_id";
  const DEVELOPED_PHOTOS_CONFIG_KEY = "developed_photos";

  const db_request = window.indexedDB.open(DB_NAME, 8);

  db_request.onerror = (event) => console.error("DB init failed", event);
  db_request.onupgradeneeded = (event) => {
    const idb = event.target.result;
    idb.createObjectStore(PHOTO_STORE, { autoIncrement: true });
    const film_store = idb.createObjectStore(FILM_STORE, {
      autoIncrement: true,
      keyPath: "id",
    });
    const config_store = idb.createObjectStore(CONFIG_STORE);

    // Initialize the active film with a new empty film
    film_store.put({ photos: [], frames: 8 }).onsuccess = (e) => {
      config_store.put(e.target.result, ACTIVE_FILM_CONFIG_KEY);
    };
    config_store.put([], DEVELOPED_PHOTOS_CONFIG_KEY);

    console.log("[PhotoDB] created new DB");
  };

  db_request.onsuccess = (event) => {
    const idb = event.target.result;
    idb.onerror = (event) =>
      console.error("[PhotoDB] Database error: ", event.target.errorCode);

    function getStore(name) {
      return idb.transaction([name], "readwrite").objectStore(name);
    }

    function getPhotoStore() {
      return getStore(PHOTO_STORE);
    }

    function getFilmStore() {
      return getStore(FILM_STORE);
    }

    function getConfigStore() {
      return getStore(CONFIG_STORE);
    }

    function addPhoto(photo) {
      return new Promise((resolve) => {
        getPhotoStore().add(photo).onsuccess = (e) => resolve(e.target.result);
      });
    }

    function loadPhoto(id) {
      return new Promise((resolve) => {
        getPhotoStore().get(id).onsuccess = (e) => resolve(e.target.result);
      });
    }

    function addFilm() {
      return new Promise((resolve) => {
        getFilmStore().add({ photos: [], frames: 8 }).onsuccess = (e) =>
          resolve(e.target.result);
      });
    }

    function loadFilm(id) {
      return new Promise((resolve) => {
        getFilmStore().get(id).onsuccess = (e) => resolve(e.target.result);
      });
    }

    function deleteFilm(id) {
      return new Promise((resolve) => {
        getFilmStore().delete(id).onsuccess = (e) => resolve(e.target.result);
      });
    }

    function setConfig(key, value) {
      return new Promise((resolve) => {
        getConfigStore().put(value, key).onsuccess = (e) =>
          resolve(e.target.result);
      });
    }

    function loadConfig(key) {
      return new Promise((resolve) => {
        getConfigStore().get(key).onsuccess = (e) => resolve(e.target.result);
      });
    }

    function setActiveFilmId(id) {
      return setConfig(ACTIVE_FILM_CONFIG_KEY, id);
    }

    function loadActiveFilmId() {
      return loadConfig(ACTIVE_FILM_CONFIG_KEY);
    }

    function loadActiveFilm() {
      return loadActiveFilmId().then(loadFilm);
    }

    function loadDevelopedPhotoIds() {
      return loadConfig(DEVELOPED_PHOTOS_CONFIG_KEY);
    }

    function addDevelopedPhotos(new_photos) {
      return loadDevelopedPhotoIds().then((photos) => {
        photos = photos.concat(new_photos);
        return setConfig(DEVELOPED_PHOTOS_CONFIG_KEY, photos);
      });
    }

    function loadAllDevelopedPhotos() {
      return loadDevelopedPhotoIds().then((photos) =>
        Promise.all(photos.map(loadPhoto))
      );
    }

    /// Add the given photo to the film with the provided id
    /// resolves to the new film
    function addPhotoToFilm(filmId, photo) {
      return new Promise((resolve) => {
        Promise.all([addPhoto(photo), loadFilm(filmId)]).then(
          ([photoId, film]) => {
            film.photos.push(photoId);
            getFilmStore().put(film).onsuccess = () => {
              resolve(film);
            };
          }
        );
      });
    }

    function addPhotoToActiveFilm(photo) {
      return loadActiveFilmId().then((filmId) => addPhotoToFilm(filmId, photo));
    }

    // Takes the photos of the given film and adds them to the list of developed photos
    // This also removes that film and return the film
    function developFilm(filmId) {
      return loadFilm(filmId).then((film) =>
        Promise.all([addDevelopedPhotos(film.photos), deleteFilm(filmId)]).then(
          () => film
        )
      );
    }

    function loadAllFilms() {
      return new Promise((resolve) => {
        getFilmStore().getAll().onsuccess = (e) => resolve(e.target.result);
      });
    }

    function loadAllFilmsInDevelopment() {
      return Promise.all([loadActiveFilmId(), loadAllFilms()]).then(
        ([activeFilmId, allFilms]) => {
          const activeIndex = allFilms.findIndex(
            (film) => film.id == activeFilmId
          );
          if (activeIndex !== -1) {
            allFilms.splice(activeIndex, 1);
          }
          return allFilms;
        }
      );
    }

    function addDevelopmentStartTimeStampToFilm(filmId, timestamp) {
      return new Promise((resolve) => {
        loadFilm(filmId).then((film) => {
          film.developmentStartDate = timestamp;
          getFilmStore().put(film).onsuccess = (e) => resolve(e.target.result);
        });
      });
    }

    function deleteDatabase() {
      indexedDB.deleteDatabase(DB_NAME);
    }

    cb({
      addPhoto,
      loadPhoto,
      addFilm,
      loadFilm,
      deleteFilm,
      addPhotoToFilm,
      deleteDatabase,
      setActiveFilmId,
      loadActiveFilmId,
      loadAllDevelopedPhotos,
      loadDevelopedPhotoIds,
      addDevelopedPhotos,
      addPhotoToActiveFilm,
      loadActiveFilm,
      developFilm,
      loadAllFilmsInDevelopment,
      addDevelopmentStartTimeStampToFilm,
    });
  };
}

export let db = null;

export function initdb(cb) {
  PhotoDB((newDb) => {
    db = newDb;
    cb();
  });
}
