export function indexIntoObject(path, root) {
  let obj = root;
  for (let el of path) {
    obj = obj[el];
  }
  return obj;
}

export function timeStamp() {
  return Date.now();
}

export function jsonclone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function repeat(count, value) {
  return Array(count).fill(value);
}

export function download(href, name = "img.png") {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function timeFormat(time) {
  const timeInSeconds = time / 1000;
  const timeInMinutes = timeInSeconds / 60;
  const timeInHours = timeInMinutes / 60;
  const timeInDays = timeInHours / 24;

  if (timeInDays > 1) {
    return Math.round(timeInDays) + " days";
  }

  if (timeInHours > 1) {
    return Math.round(timeInHours) + " hours";
  }

  if (timeInMinutes > 1) {
    return Math.round(timeInMinutes) + " minutes";
  }

  return "under a minute";
}
