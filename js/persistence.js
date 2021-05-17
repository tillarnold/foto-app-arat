function resultPromise(v) {
  return new Promise((resolve) => {
    v.onsuccess = (e) => resolve(e.target.result);
  });
}

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
    idb.onerror = (event) => console.error("[PhotoDB] Database error: ", event.target.errorCode);

    const getStore = (name) => idb.transaction([name], "readwrite").objectStore(name);
    const getPhotoStore = () => getStore(PHOTO_STORE);
    const getFilmStore = () => getStore(FILM_STORE);
    const getConfigStore = () => getStore(CONFIG_STORE);

    const addPhoto = (photo) => resultPromise(getPhotoStore().add(photo));
    const loadPhoto = (id) => resultPromise(getPhotoStore().get(id));

    const addFilm = () => resultPromise(getFilmStore().add({ photos: [], frames: 8 }));
    const loadFilm = (id) => resultPromise(getFilmStore().get(id));
    const putFilm = (film) => resultPromise(getFilmStore().put(film));
    const deleteFilm = (id) => resultPromise(getFilmStore().delete(id));
    const loadAllFilms = () => resultPromise(getFilmStore().getAll());

    const setConfig = (key, value) => resultPromise(getConfigStore().put(value, key));
    const loadConfig = (key) => resultPromise(getConfigStore().get(key));
    const setActiveFilmId = (id) => setConfig(ACTIVE_FILM_CONFIG_KEY, id);
    const loadActiveFilmId = () => loadConfig(ACTIVE_FILM_CONFIG_KEY);
    const loadActiveFilm = () => loadActiveFilmId().then(loadFilm);
    const loadDevelopedPhotoIds = () => loadConfig(DEVELOPED_PHOTOS_CONFIG_KEY);

    async function addDevelopedPhotos(new_photos) {
      let photos = await loadDevelopedPhotoIds();
      photos = photos.concat(new_photos);
      return await setConfig(DEVELOPED_PHOTOS_CONFIG_KEY, photos);
    }

    async function loadAllDevelopedPhotos() {
      const photos = await loadDevelopedPhotoIds();
      return await Promise.all(photos.map(loadPhoto));
    }

    /// Add the given photo to the film with the provided id
    /// resolves to the new film
    async function addPhotoToFilm(filmId, photo) {
      const [photoId, film] = await Promise.all([addPhoto(photo), loadFilm(filmId)]);
      film.photos.push(photoId);
      await putFilm(film);
      return film;
    }

    async function addPhotoToActiveFilm(photo) {
      const filmId = await loadActiveFilmId();
      return await addPhotoToFilm(filmId, photo);
    }

    // Takes the photos of the given film and adds them to the list of developed photos
    // This also removes that film and return the film
    async function developFilm(filmId) {
      const film = await loadFilm(filmId);
      await Promise.all([addDevelopedPhotos(film.photos), deleteFilm(filmId)]);
      return film;
    }

    async function loadAllFilmsInDevelopment() {
      const [activeFilmId, allFilms] = await Promise.all([loadActiveFilmId(), loadAllFilms()]);
      const activeIndex = allFilms.findIndex((film) => film.id === activeFilmId);
      if (activeIndex !== -1) {
        allFilms.splice(activeIndex, 1);
      }
      return allFilms;
    }

    async function addDevelopmentStartTimeStampToFilm(filmId, timestamp) {
      const film = await loadFilm(filmId);
      film.developmentStartDate = timestamp;
      return await putFilm(film);
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
