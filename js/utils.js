export function index(path, root) {
    let obj = root;
    for (let el of path) {
        obj = obj[el]
    }
    return obj;
}


export function timeStamp() {
    return Date.now()
}

export function jsonclone(obj) {
    return JSON.parse(JSON.stringify(obj))
}

export function download(href, name = "img.png") {
    const a = document.createElement("a");
    a.href = href
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}