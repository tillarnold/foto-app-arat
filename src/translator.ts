function getLangaugePreferences(): string[] {
  const languages = [];

  const languageOverride = window.localStorage.languageOverride;
  if (languageOverride) {
    languages.push(languageOverride);
    languages.push(languageOverride.split("-")[0]);
  }

  languages.push(window.navigator.language);
  languages.push(window.navigator.language.split("-")[0]);
  languages.push("en");

  return languages;
}

const languagePrefs = getLangaugePreferences();

console.log({ languagePrefs });

function selectL(desc: { [key: string]: () => string }): string {
  for (const lang of languagePrefs) {
    let selection = desc[lang];
    if (selection) {
      return selection();
    }
  }
  console.error("Missing translation!");
  return "???";
}

const c = (cond: boolean, text: string) => (cond ? text : "");

export const deleteDatabaseConfirmation = (): string =>
  selectL({
    de: () => "Sind Sie sicher, dass Sie alle Daten löschen wollen?",
    en: () => "Are you sure you want to delete all data?",
  });

export const gallery = (): string =>
  selectL({
    de: () => "Galerie",
    en: () => "Gallery",
  });

export const shop = (): string =>
  selectL({
    de: () => "Fotoladen",
    en: () => "Shop",
  });

export const readyForPickup = (): string =>
  selectL({
    de: () => "Abhohlbereit!",
    en: () => "Ready for pickup!",
  });

export const back = (): string =>
  selectL({
    de: () => "Zurück",
    en: () => "Back",
  });

export const downloadAll = (): string =>
  selectL({
    de: () => "Herunterladen",
    en: () => "Download",
  });

export const instantDevelopmentMode = (): string =>
  selectL({
    de: () => "Sofortbildmodus",
    en: () => "Instant camera mode",
  });

export const pleaseAllowVideoPlayback = (): string =>
  selectL({
    de: () => "Hey, bitte dücke diesen Knopf um der App zu erlauben Video darzustellen.",
    en: () => "Hey, please press this button to allow the app to show you video.",
  });

export const allow = (): string =>
  selectL({
    de: () => "Erlauben",
    en: () => "Allow",
  });

export const nrOfFilmsInLab = (count: number): string => {
  const single = count === 1;
  return selectL({
    de: () =>
      `Momentan ${single ? "ist" : "sind"} ${count} Film${c(!single, "e")} in der Dunkelkammer`,
    en: () => `There ${single ? "is" : "are"} currently ${count} film${c(!single, "s")} in the lab`,
  });
};

const day = (): string =>
  selectL({
    de: () => "Tag",
    en: () => "day",
  });

const days = (): string =>
  selectL({
    de: () => "Tagen",
    en: () => "days",
  });

const hour = (): string =>
  selectL({
    de: () => "Stunde",
    en: () => "hour",
  });

const hours = (): string =>
  selectL({
    de: () => "Stunden",
    en: () => "hours",
  });

const minute = (): string =>
  selectL({
    de: () => "Minute",
    en: () => "minute",
  });

const minutes = (): string =>
  selectL({
    de: () => "Minuten",
    en: () => "minutes",
  });

export function timeFormat(time: number): string {
  const timeInSeconds = time / 1000;
  const timeInMinutes = timeInSeconds / 60;
  const timeInHours = timeInMinutes / 60;
  const timeInDays = timeInHours / 24;

  if (timeInDays > 1) {
    const res = Math.round(timeInDays);
    return res + " " + (res === 1 ? day() : days());
  }

  if (timeInHours > 1) {
    const res = Math.round(timeInHours);
    return res + " " + (res === 1 ? hour() : hours());
  }

  if (timeInMinutes > 1) {
    const res = Math.round(timeInMinutes);
    return res + " " + (res === 1 ? minute() : minutes());
  }

  return selectL({
    de: () => "weniger als einer Minute",
    en: () => "under a minute",
  });
}

export const filmReadyIn = (time: number): string =>
  selectL({
    de: () => `Abholbereit in ${timeFormat(time)}`,
    en: () => `The film will be ready in ${timeFormat(time)}`,
  });
