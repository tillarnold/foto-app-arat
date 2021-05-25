export function indexIntoObject(path: string[], root: any): any {
  let obj = root;
  for (let el of path) {
    obj = obj[el];
  }
  return obj;
}

export function jsonclone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function repeat<T>(count: number, value: T): T[] {
  return Array(count).fill(value);
}

export function download(href: string, name = "img.png"): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function toBinary(string: string): string {
  const codeUnits = new Uint16Array(string.length);
  for (let i = 0; i < codeUnits.length; i++) {
    codeUnits[i] = string.charCodeAt(i);
  }
  return String.fromCharCode(...new Uint8Array(codeUnits.buffer));
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const decoder = new TextDecoder("utf8");
  const decoded = decoder.decode(arrayBuffer);
  const binaryString = toBinary(decoded);
  return btoa(binaryString);
}

export function hashPhoto(photo: string): Promise<string> {
  const enc = new TextEncoder();
  const array = enc.encode(photo);
  return crypto.subtle.digest("SHA-1", array).then(arrayBufferToBase64);
}

export function photoFileName(photo: string): Promise<string> {
  return hashPhoto(photo).then(
    (hash) => hash.replace(/_/g, "").replace(/\//g, "").substring(3, 13) + ".png"
  );
}

/**
 * Converts the given photo dataurl to a File object
 */
export async function photoToFile(photo: string): Promise<File> {
  const res = await fetch(photo);
  const buffer = await res.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-1", buffer);
  const hashString = arrayBufferToBase64(hash);
  const fileName = hashString.replace(/_/g, "").replace(/\//g, "").substring(3, 13) + ".png";

  const file = new File([buffer], fileName, {
    type: "image/png",
  });
  return file;
}

export async function shareDownload(photos: string[]) {
  if (!("share" in window.navigator)) {
    //TODO: polyfill this?
    return Promise.resolve(new Error("navigator.share not supported"));
  }

  const files = await Promise.all(photos.map(photoToFile));
  const shareData = { files } as ShareData;
  return await navigator.share(shareData);
}
