import { Film, Photo } from "./persistence";

export type State = {
  activeFilm: Film;
  filmsInDevelopment: Film[];
  galleryImages: Photo[];
  path: Path;
  currentTime: number;
  zeroDevelopmentTime: boolean;
  showVideoPermissionPopup: boolean;
  galleryDownloadInProgress: boolean;
};

export enum Path {
  Camera = "@#camera",
  Shop = "@#shop",
  Gallery = "@#gallery",
}
