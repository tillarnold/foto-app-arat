export function persistent_value(db_name, initial_value, cb) {
    const DATA_KEY = 1;
    const DATA_STORE_NAME = "dataObjectStore"
    const db_request = window.indexedDB.open(db_name, 7);

    db_request.onerror = event => console.error("DB init failed", event);
    db_request.onupgradeneeded = event => {
        const idb = event.target.result;
        const objectStore = idb.createObjectStore(DATA_STORE_NAME);
        objectStore.add(initial_value, DATA_KEY);
        console.log("created the db")
    }

    db_request.onsuccess = function (event) {
        const idb = event.target.result;
        idb.onerror = event => console.error("Database error: ", event.target.errorCode);

        function getObjectStore() {
            const transaction = idb.transaction([DATA_STORE_NAME], "readwrite");
            return transaction.objectStore(DATA_STORE_NAME);
        }


        function load(cb) {
            const request = getObjectStore().get(DATA_KEY);
            request.onsuccess = cb;
        }

        load(event => {
            let data = event.target.result;
            console.log(data)

            function persist() {
                getObjectStore().put(data, DATA_KEY)
            }

            cb(data, persist)
        })
    }
}


export function PhotoDB(cb) {
    const DB_NAME = "Foto-App-Arat";
    const PHOTO_STORE = "photos";
    const FILM_STORE = "films";
    const CONFIG_STORE = "config";


    const ACTIVE_FILM_CONFIG_KEY = "active_film_id";
    const DEVELOPED_PHOTOS_CONFIG_KEY = "developed_photos";

    const db_request = window.indexedDB.open(DB_NAME, 8);

    db_request.onerror = event => console.error("DB init failed", event);
    db_request.onupgradeneeded = event => {
        const idb = event.target.result;
        idb.createObjectStore(PHOTO_STORE, { autoIncrement: true });
        const film_store = idb.createObjectStore(FILM_STORE, { autoIncrement: true });
        const config_store = idb.createObjectStore(CONFIG_STORE, { autoIncrement: true });

        // Initialize the active film with a new empty film
        film_store.put({ photos: [] }).onsuccess = e => {
            config_store.put(e.target.result, ACTIVE_FILM_CONFIG_KEY);
        };
        config_store.put([], DEVELOPED_PHOTOS_CONFIG_KEY);

        console.log("[PhotoDB] created new DB")
    }

    db_request.onsuccess = event => {
        const idb = event.target.result;
        idb.onerror = event => console.error("[PhotoDB] Database error: ", event.target.errorCode);

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
            return new Promise((resolve, _) => {
                getPhotoStore().add(photo).onsuccess = e => resolve(e.target.result);
            });
        }

        function loadPhoto(id) {
            return new Promise((resolve, _) => {
                getPhotoStore().get(id).onsuccess = e => resolve(e.target.result);
            });
        }

        function addFilm() {
            return new Promise((resolve, _) => {
                getFilmStore().add({ photos: [] }).onsuccess = e => resolve(e.target.result);
            });
        }

        function loadFilm(id) {
            return new Promise((resolve, _) => {
                getFilmStore().get(id).onsuccess = e => resolve(e.target.result);
            });
        }

        function setConfig(key, value) {
            return new Promise((resolve, _) => {
                getConfigStore().put(value, key).onsuccess = e => resolve(e.target.result);
            });
        }

        function loadConfig(key) {
            return new Promise((resolve, _) => {
                getConfigStore().get(key).onsuccess = e => resolve(e.target.result);
            });
        }



        function setActiveFilm(id) {
            return setConfig(ACTIVE_FILM_CONFIG_KEY, id);
        }

        function loadActiveFilm() {
            return loadConfig(ACTIVE_FILM_CONFIG_KEY);
        }

        function loadDevelopedPhotos() {
            return loadConfig(DEVELOPED_PHOTOS_CONFIG_KEY);
        }

        function addDevelopedPhotos(new_photos) {
            return loadDevelopedPhotos().then(photos => {
                photos = photos.concat(new_photos);
                return setConfig(DEVELOPED_PHOTOS_CONFIG_KEY, photos);
            });
        }

        function deleteDatabase() {
            indexedDB.deleteDatabase(DB_NAME)
        }


        /// Add the given photo to the film with the provided id
        /// resolves to the new film of photos in the film
        function addPhotoToFilm(filmId, photo) {
            return new Promise((resolve, _) => {
                Promise.all([addPhoto(photo), loadFilm(filmId)]).then(([photoId, film]) => {
                    film.photos.push(photoId)
                    getFilmStore().put(film, filmId).onsuccess = e => {
                        resolve(film)
                    };
                });
            });
        }

        function addPhotoToActiveFilm(photo) {
            return loadActiveFilm().then(filmId => addPhotoToFilm(filmId, photo))
        }

        cb({
            addPhoto,
            loadPhoto,
            addFilm,
            loadFilm,
            addPhotoToFilm,
            deleteDatabase,
            setActiveFilm,
            loadActiveFilm,
            loadDevelopedPhotos,
            addDevelopedPhotos,
            addPhotoToActiveFilm
        })
    }
}