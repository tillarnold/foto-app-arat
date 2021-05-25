/**
 * Takes a IDBRequest and returns a promise that resolves
 * to the target.result property of the onsuccess Event
 *
 * This helper function is used in PhotoDB to convert the callback-based
 * IndexedDB API into a more convinient promise-based API
 */
function resultPromise<T>(v: IDBRequest<T>): Promise<T> {
  return new Promise((resolve) => {
    v.onsuccess = (e) => resolve((e.target as any).result);
  });
}

export type Film = {
  id: number;
  photos: number[];
  developmentStartDate?: number;
  frames: number;
};

export type Photo = string;

const DB_NAME = "Foto-App-Arat";
const PHOTO_STORE = "photos";
const FILM_STORE = "films";
const CONFIG_STORE = "config";

const ACTIVE_FILM_CONFIG_KEY = "active_film_id";
const DEVELOPED_PHOTOS_CONFIG_KEY = "developed_photos";

class PhotoDB {
  private idb: IDBDatabase;

  constructor(cb: () => void) {
    const dbRequest: IDBOpenDBRequest = window.indexedDB.open(DB_NAME, 8);

    dbRequest.onerror = (event) => console.error("DB init failed", event);
    dbRequest.onupgradeneeded = (event) => {
      const idb: IDBDatabase = (event.target as any).result as IDBDatabase;
      idb.createObjectStore(PHOTO_STORE, { autoIncrement: true });
      const film_store = idb.createObjectStore(FILM_STORE, {
        autoIncrement: true,
        keyPath: "id",
      });
      const config_store = idb.createObjectStore(CONFIG_STORE);

      // Initialize the active film with a new empty film
      film_store.put({ photos: [], frames: 8 }).onsuccess = (e) => {
        config_store.put((e.target as any).result, ACTIVE_FILM_CONFIG_KEY);
      };
      config_store.put([], DEVELOPED_PHOTOS_CONFIG_KEY);

      console.log("[PhotoDB] created new DB");
    };

    dbRequest.onsuccess = (event) => {
      const idb: IDBDatabase = (event.target as any).result as IDBDatabase;
      this.idb = idb;
      idb.onerror = (event) =>
        console.error("[PhotoDB] Database error: ", (event.target as any).errorCode);
      cb();
    };
  }

  getStore(name: string) {
    return this.idb.transaction([name], "readwrite").objectStore(name);
  }

  getPhotoStore() {
    return this.getStore(PHOTO_STORE);
  }
  getFilmStore() {
    return this.getStore(FILM_STORE);
  }
  getConfigStore() {
    return this.getStore(CONFIG_STORE);
  }

  addPhoto(photo: Photo): Promise<number> {
    return resultPromise(this.getPhotoStore().add(photo) as IDBRequest<number>);
  }

  loadPhoto(id: number) {
    return resultPromise(this.getPhotoStore().get(id));
  }

  addFilm() {
    return resultPromise(this.getFilmStore().add({ photos: [], frames: 8 }) as IDBRequest<number>);
  }
  loadFilm(id: number): Promise<Film> {
    return resultPromise(this.getFilmStore().get(id));
  }
  putFilm(film: Film) {
    return resultPromise(this.getFilmStore().put(film));
  }
  deleteFilm(id: number) {
    return resultPromise(this.getFilmStore().delete(id));
  }
  loadAllFilms(): Promise<Film[]> {
    return resultPromise(this.getFilmStore().getAll());
  }

  setConfig(key: string, value: any) {
    return resultPromise(this.getConfigStore().put(value, key));
  }
  loadConfig(key: string): any {
    return resultPromise(this.getConfigStore().get(key));
  }
  setActiveFilmId(id: number) {
    return this.setConfig(ACTIVE_FILM_CONFIG_KEY, id);
  }
  loadActiveFilmId(): Promise<number> {
    return this.loadConfig(ACTIVE_FILM_CONFIG_KEY);
  }
  async loadActiveFilm(): Promise<Film> {
    const filmId = await this.loadActiveFilmId();
    return await this.loadFilm(filmId);
  }
  loadDevelopedPhotoIds(): Promise<number[]> {
    return this.loadConfig(DEVELOPED_PHOTOS_CONFIG_KEY);
  }

  async addDevelopedPhotos(newPhotos: number[]) {
    let photos = await this.loadDevelopedPhotoIds();
    photos = photos.concat(newPhotos);
    return await this.setConfig(DEVELOPED_PHOTOS_CONFIG_KEY, photos);
  }

  async loadAllDevelopedPhotos(): Promise<Photo[]> {
    const photos = await this.loadDevelopedPhotoIds();
    return await Promise.all(photos.map((photoId) => this.loadPhoto(photoId)));
  }

  /**
   * Add the given photo to the film with the provided id
   * resolves to the new film
   */
  async addPhotoToFilm(filmId: number, photo: Photo): Promise<Film> {
    //FIXME: wong return type to test typescript
    const [photoId, film] = await Promise.all([this.addPhoto(photo), this.loadFilm(filmId)]);
    film.photos.push(photoId);
    await this.putFilm(film);
    return film;
  }

  async addPhotoToActiveFilm(photo: Photo): Promise<Film> {
    const filmId = await this.loadActiveFilmId();
    return await this.addPhotoToFilm(filmId, photo);
  }

  /**
   * Takes the photos of the given film and adds them to the list of developed photos
   * This also removes that film and return the film
   */
  async developFilm(filmId: number): Promise<Film> {
    const film = await this.loadFilm(filmId);
    await Promise.all([this.addDevelopedPhotos(film.photos), this.deleteFilm(filmId)]);
    return film;
  }

  async loadAllFilmsInDevelopment(): Promise<Film[]> {
    const [activeFilmId, allFilms] = await Promise.all([
      this.loadActiveFilmId(),
      this.loadAllFilms(),
    ]);
    const activeIndex = allFilms.findIndex((film) => film.id === activeFilmId);
    if (activeIndex !== -1) {
      allFilms.splice(activeIndex, 1);
    }
    return allFilms;
  }

  async addDevelopmentStartTimeStampToFilm(filmId: number, timestamp: number) {
    const film = await this.loadFilm(filmId);
    film.developmentStartDate = timestamp;
    return await this.putFilm(film);
  }

  deleteDatabase() {
    window.indexedDB.deleteDatabase(DB_NAME);
  }
}

export let db: PhotoDB = null;

export function initdb(): Promise<void> {
  return new Promise((resolve) => {
    db = new PhotoDB(() => {
      resolve(null);
    });
  });
}
