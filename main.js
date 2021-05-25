/**
 * Takes a IDBRequest and returns a promise that resolves
 * to the target.result property of the onsuccess Event
 *
 * This helper function is used in PhotoDB to convert the callback-based
 * IndexedDB API into a more convinient promise-based API
 */ function resultPromise(v) {
    return new Promise((resolve)=>{
        v.onsuccess = (e)=>resolve(e.target.result)
        ;
    });
}
const DB_NAME = "Foto-App-Arat";
const PHOTO_STORE = "photos";
const FILM_STORE = "films";
const CONFIG_STORE = "config";
const ACTIVE_FILM_CONFIG_KEY = "active_film_id";
const DEVELOPED_PHOTOS_CONFIG_KEY = "developed_photos";
class PhotoDB {
    constructor(cb){
        const dbRequest = window.indexedDB.open(DB_NAME, 8);
        dbRequest.onerror = (event)=>console.error("DB init failed", event)
        ;
        dbRequest.onupgradeneeded = (event)=>{
            const idb = event.target.result;
            idb.createObjectStore(PHOTO_STORE, {
                autoIncrement: true
            });
            const film_store = idb.createObjectStore(FILM_STORE, {
                autoIncrement: true,
                keyPath: "id"
            });
            const config_store = idb.createObjectStore(CONFIG_STORE);
            // Initialize the active film with a new empty film
            film_store.put({
                photos: [],
                frames: 8
            }).onsuccess = (e)=>{
                config_store.put(e.target.result, ACTIVE_FILM_CONFIG_KEY);
            };
            config_store.put([], DEVELOPED_PHOTOS_CONFIG_KEY);
            console.log("[PhotoDB] created new DB");
        };
        dbRequest.onsuccess = (event)=>{
            const idb = event.target.result;
            this.idb = idb;
            idb.onerror = (event1)=>console.error("[PhotoDB] Database error: ", event1.target.errorCode)
            ;
            cb();
        };
    }
    getStore(name) {
        return this.idb.transaction([
            name
        ], "readwrite").objectStore(name);
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
    addPhoto(photo) {
        return resultPromise(this.getPhotoStore().add(photo));
    }
    loadPhoto(id) {
        return resultPromise(this.getPhotoStore().get(id));
    }
    addFilm() {
        return resultPromise(this.getFilmStore().add({
            photos: [],
            frames: 8
        }));
    }
    loadFilm(id) {
        return resultPromise(this.getFilmStore().get(id));
    }
    putFilm(film) {
        return resultPromise(this.getFilmStore().put(film));
    }
    deleteFilm(id) {
        return resultPromise(this.getFilmStore().delete(id));
    }
    loadAllFilms() {
        return resultPromise(this.getFilmStore().getAll());
    }
    setConfig(key, value) {
        return resultPromise(this.getConfigStore().put(value, key));
    }
    loadConfig(key) {
        return resultPromise(this.getConfigStore().get(key));
    }
    setActiveFilmId(id) {
        return this.setConfig(ACTIVE_FILM_CONFIG_KEY, id);
    }
    loadActiveFilmId() {
        return this.loadConfig(ACTIVE_FILM_CONFIG_KEY);
    }
    async loadActiveFilm() {
        const filmId = await this.loadActiveFilmId();
        return await this.loadFilm(filmId);
    }
    loadDevelopedPhotoIds() {
        return this.loadConfig(DEVELOPED_PHOTOS_CONFIG_KEY);
    }
    async addDevelopedPhotos(newPhotos) {
        let photos = await this.loadDevelopedPhotoIds();
        photos = photos.concat(newPhotos);
        return await this.setConfig(DEVELOPED_PHOTOS_CONFIG_KEY, photos);
    }
    async loadAllDevelopedPhotos() {
        const photos = await this.loadDevelopedPhotoIds();
        return await Promise.all(photos.map((photoId)=>this.loadPhoto(photoId)
        ));
    }
    /**
   * Add the given photo to the film with the provided id
   * resolves to the new film
   */ async addPhotoToFilm(filmId, photo) {
        //FIXME: wong return type to test typescript
        const [photoId, film] = await Promise.all([
            this.addPhoto(photo),
            this.loadFilm(filmId)
        ]);
        film.photos.push(photoId);
        await this.putFilm(film);
        return film;
    }
    async addPhotoToActiveFilm(photo) {
        const filmId = await this.loadActiveFilmId();
        return await this.addPhotoToFilm(filmId, photo);
    }
    /**
   * Takes the photos of the given film and adds them to the list of developed photos
   * This also removes that film and return the film
   */ async developFilm(filmId) {
        const film = await this.loadFilm(filmId);
        await Promise.all([
            this.addDevelopedPhotos(film.photos),
            this.deleteFilm(filmId)
        ]);
        return film;
    }
    async loadAllFilmsInDevelopment() {
        const [activeFilmId, allFilms] = await Promise.all([
            this.loadActiveFilmId(),
            this.loadAllFilms(), 
        ]);
        const activeIndex = allFilms.findIndex((film)=>film.id === activeFilmId
        );
        if (activeIndex !== -1) allFilms.splice(activeIndex, 1);
        return allFilms;
    }
    async addDevelopmentStartTimeStampToFilm(filmId, timestamp) {
        const film = await this.loadFilm(filmId);
        film.developmentStartDate = timestamp;
        return await this.putFilm(film);
    }
    deleteDatabase() {
        window.indexedDB.deleteDatabase(DB_NAME);
    }
}
let db = null;
function initdb() {
    return new Promise((resolve)=>{
        db = new PhotoDB(()=>{
            resolve(null);
        });
    });
}
var SSR_NODE = 1;
var TEXT_NODE = 3;
var EMPTY_OBJ = {
};
var EMPTY_ARR = [];
var SVG_NS = "http://www.w3.org/2000/svg";
var id = (a)=>a
;
var map = EMPTY_ARR.map;
var isArray = Array.isArray;
var enqueue = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : setTimeout;
var createClass = (obj)=>{
    var out = "";
    if (typeof obj === "string") return obj;
    if (isArray(obj)) {
        for(var k = 0, tmp; k < obj.length; k++)if (tmp = createClass(obj[k])) out += (out && " ") + tmp;
    } else {
        for(var k in obj)if (obj[k]) out += (out && " ") + k;
    }
    return out;
};
var shouldRestart = (a, b)=>{
    for(var k in {
        ...a,
        ...b
    }){
        if (typeof (isArray(a[k]) ? a[k][0] : a[k]) === "function") b[k] = a[k];
        else if (a[k] !== b[k]) return true;
    }
};
var patchSubs = (oldSubs, newSubs = EMPTY_ARR, dispatch)=>{
    for(var subs = [], i = 0, oldSub, newSub; i < oldSubs.length || i < newSubs.length; i++){
        oldSub = oldSubs[i];
        newSub = newSubs[i];
        subs.push(newSub && newSub !== true ? !oldSub || newSub[0] !== oldSub[0] || shouldRestart(newSub[1], oldSub[1]) ? [
            newSub[0],
            newSub[1],
            (oldSub && oldSub[2](), newSub[0](dispatch, newSub[1])), 
        ] : oldSub : oldSub && oldSub[2]());
    }
    return subs;
};
var getKey = (vdom)=>vdom == null ? vdom : vdom.key
;
var patchProperty = (node, key, oldValue, newValue, listener, isSvg)=>{
    if (key === "key") ;
    else if (key === "style") for(var k in {
        ...oldValue,
        ...newValue
    }){
        oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
        if (k[0] === "-") node[key].setProperty(k, oldValue);
        else node[key][k] = oldValue;
    }
    else if (key[0] === "o" && key[1] === "n") {
        if (!((node.events || (node.events = {
        }))[key = key.slice(2)] = newValue)) node.removeEventListener(key, listener);
        else if (!oldValue) node.addEventListener(key, listener);
    } else if (!isSvg && key !== "list" && key !== "form" && key in node) node[key] = newValue == null ? "" : newValue;
    else if (newValue == null || newValue === false || key === "class" && !(newValue = createClass(newValue))) node.removeAttribute(key);
    else node.setAttribute(key, newValue);
};
var createNode = (vdom, listener, isSvg)=>{
    var props = vdom.props;
    var node = vdom.type === TEXT_NODE ? document.createTextNode(vdom.tag) : (isSvg = isSvg || vdom.tag === "svg") ? document.createElementNS(SVG_NS, vdom.tag, {
        is: props.is
    }) : document.createElement(vdom.tag, {
        is: props.is
    });
    for(var k in props)patchProperty(node, k, null, props[k], listener, isSvg);
    for(var i = 0; i < vdom.children.length; i++)node.appendChild(createNode(vdom.children[i] = maybeVNode(vdom.children[i]), listener, isSvg));
    return vdom.node = node;
};
var patch = (parent, node, oldVNode, newVNode, listener, isSvg)=>{
    if (oldVNode === newVNode) ;
    else if (oldVNode != null && oldVNode.type === TEXT_NODE && newVNode.type === TEXT_NODE) {
        if (oldVNode.tag !== newVNode.tag) node.nodeValue = newVNode.tag;
    } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
        node = parent.insertBefore(createNode(newVNode = maybeVNode(newVNode), listener, isSvg), node);
        if (oldVNode != null) parent.removeChild(oldVNode.node);
    } else {
        var tmpVKid;
        var oldVKid;
        var oldKey;
        var newKey;
        var oldProps = oldVNode.props;
        var newProps = newVNode.props;
        var oldVKids = oldVNode.children;
        var newVKids = newVNode.children;
        var oldHead = 0;
        var newHead = 0;
        var oldTail = oldVKids.length - 1;
        var newTail = newVKids.length - 1;
        isSvg = isSvg || newVNode.tag === "svg";
        for(var i in {
            ...oldProps,
            ...newProps
        })if ((i === "value" || i === "selected" || i === "checked" ? node[i] : oldProps[i]) !== newProps[i]) patchProperty(node, i, oldProps[i], newProps[i], listener, isSvg);
        while(newHead <= newTail && oldHead <= oldTail){
            if ((oldKey = getKey(oldVKids[oldHead])) == null || oldKey !== getKey(newVKids[newHead])) break;
            patch(node, oldVKids[oldHead].node, oldVKids[oldHead], newVKids[newHead] = maybeVNode(newVKids[newHead++], oldVKids[oldHead++]), listener, isSvg);
        }
        while(newHead <= newTail && oldHead <= oldTail){
            if ((oldKey = getKey(oldVKids[oldTail])) == null || oldKey !== getKey(newVKids[newTail])) break;
            patch(node, oldVKids[oldTail].node, oldVKids[oldTail], newVKids[newTail] = maybeVNode(newVKids[newTail--], oldVKids[oldTail--]), listener, isSvg);
        }
        if (oldHead > oldTail) while(newHead <= newTail)node.insertBefore(createNode(newVKids[newHead] = maybeVNode(newVKids[newHead++]), listener, isSvg), (oldVKid = oldVKids[oldHead]) && oldVKid.node);
        else if (newHead > newTail) while(oldHead <= oldTail)node.removeChild(oldVKids[oldHead++].node);
        else {
            for(var keyed = {
            }, newKeyed = {
            }, i = oldHead; i <= oldTail; i++)if ((oldKey = oldVKids[i].key) != null) keyed[oldKey] = oldVKids[i];
            while(newHead <= newTail){
                oldKey = getKey(oldVKid = oldVKids[oldHead]);
                newKey = getKey(newVKids[newHead] = maybeVNode(newVKids[newHead], oldVKid));
                if (newKeyed[oldKey] || newKey != null && newKey === getKey(oldVKids[oldHead + 1])) {
                    if (oldKey == null) node.removeChild(oldVKid.node);
                    oldHead++;
                    continue;
                }
                if (newKey == null || oldVNode.type === SSR_NODE) {
                    if (oldKey == null) {
                        patch(node, oldVKid && oldVKid.node, oldVKid, newVKids[newHead], listener, isSvg);
                        newHead++;
                    }
                    oldHead++;
                } else {
                    if (oldKey === newKey) {
                        patch(node, oldVKid.node, oldVKid, newVKids[newHead], listener, isSvg);
                        newKeyed[newKey] = true;
                        oldHead++;
                    } else if ((tmpVKid = keyed[newKey]) != null) {
                        patch(node, node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node), tmpVKid, newVKids[newHead], listener, isSvg);
                        newKeyed[newKey] = true;
                    } else patch(node, oldVKid && oldVKid.node, null, newVKids[newHead], listener, isSvg);
                    newHead++;
                }
            }
            while(oldHead <= oldTail)if (getKey(oldVKid = oldVKids[oldHead++]) == null) node.removeChild(oldVKid.node);
            for(var i in keyed)if (newKeyed[i] == null) node.removeChild(keyed[i].node);
        }
    }
    return newVNode.node = node;
};
var propsChanged = (a, b)=>{
    for(var k in a)if (a[k] !== b[k]) return true;
    for(var k in b)if (a[k] !== b[k]) return true;
};
var maybeVNode = (newVNode, oldVNode)=>newVNode !== true && newVNode !== false && newVNode ? typeof newVNode.tag === "function" ? ((!oldVNode || oldVNode.memo == null || propsChanged(oldVNode.memo, newVNode.memo)) && ((oldVNode = newVNode.tag(newVNode.memo)).memo = newVNode.memo), oldVNode) : newVNode : text("")
;
var recycleNode = (node)=>node.nodeType === TEXT_NODE ? text(node.nodeValue, node) : createVNode(node.nodeName.toLowerCase(), EMPTY_OBJ, map.call(node.childNodes, recycleNode), SSR_NODE, node)
;
var createVNode = (tag, props, children, type, node)=>({
        tag,
        props,
        key: props.key,
        children,
        type,
        node
    })
;
var text = (value, node)=>createVNode(value, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, node)
;
var h = (tag, props, children = EMPTY_ARR)=>createVNode(tag, props, isArray(children) ? children : [
        children
    ])
;
var app = ({ node , view , subscriptions , dispatch =id , init =EMPTY_OBJ ,  })=>{
    var vdom = node && recycleNode(node);
    var subs = [];
    var state;
    var busy;
    var update = (newState)=>{
        if (state !== newState) {
            if ((state = newState) == null) dispatch = subscriptions = render = id;
            if (subscriptions) subs = patchSubs(subs, subscriptions(state), dispatch);
            if (view && !busy) enqueue(render, busy = true);
        }
    };
    var render = ()=>node = patch(node.parentNode, node, vdom, vdom = view(state), listener, busy = false)
    ;
    var listener = function(event) {
        dispatch(this.events[event.type], event);
    };
    return (dispatch = dispatch((action, props)=>typeof action === "function" ? dispatch(action(state, props)) : isArray(action) ? typeof action[0] === "function" ? dispatch(action[0], action[1]) : action.slice(1).map((fx)=>fx && fx !== true && fx[0](dispatch, fx[1])
        , update(action[0])) : update(action)
    ))(init), dispatch;
};
function PhotoCamera() {
    const player = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let playing = false;
    player.playsInline = true; //Needed to show to viewfinder on iOS
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment"
        }
    }).then((stream)=>{
        player.srcObject = stream;
        forcePlay();
    }).catch((err)=>console.error("An error occurred while getting the camera stream:", err)
    );
    player.addEventListener("canplay", adjustSize);
    window.addEventListener("resize", adjustSize);
    function adjustSize() {
        canvas.width = player.videoWidth;
        canvas.height = player.videoHeight;
    }
    /**
   * Takes a photo
   */ function snap() {
        adjustSize();
        ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
    }
    function getVideoElement() {
        return player;
    }
    function forcePlay() {
        return player.play().catch((e)=>{
            console.log("error while playing video", e);
            playing = false;
            return e;
        }).then((e)=>{
            console.log("Play video was successufull", e);
            playing = true;
            return e;
        });
    }
    return {
        snap,
        getVideoElement,
        forcePlay,
        isPlaying: ()=>playing
    };
}
function fetchArrayBuffer(url) {
    return fetch(url).then((response)=>response.arrayBuffer()
    );
}
function fetchAudio(url, ctx) {
    return fetchArrayBuffer(url).then((buffer)=>ctx.decodeAudioData(buffer)
    );
}
delete window.AudioContext;
class AudioPlayer {
    constructor(){
        this.disabled = !("AudioContext" in window);
        if (!this.disabled) {
            this.audioContext = new AudioContext();
            this.cache = new Map();
        } else console.warn("This device does not support AudioContext. Audio playback was disabled.");
    }
    async load(url) {
        if (this.disabled) return new Error("AudioContext not supported");
        const result = await fetchAudio(url, this.audioContext);
        this.cache.set(url, result);
        return result;
    }
    /// Returns the audio buffer at that url or an empty buffer if it is not loaded yet
    get(url) {
        if (this.cache.has(url)) return this.cache.get(url);
        this.load(url);
        console.warn("[AudioPlayer] tried to play non-loaded sound");
        return this.audioContext.createBuffer(2, 22050, 44100);
    }
    getAudioBufferSourceNode(url) {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.get(url);
        source.connect(this.audioContext.destination);
        return source;
    }
    play(url) {
        if (this.disabled) return new Error("AudioContext not supported");
        const source = this.getAudioBufferSourceNode(url);
        source.start(0);
        return source;
    }
    loop(url) {
        if (this.disabled) return new Error("AudioContext not supported");
        const source = this.getAudioBufferSourceNode(url);
        source.loop = true;
        source.start(0);
        return source;
    }
}
const globalAudioPlayer = new AudioPlayer();
function download(href, name = "img.png") {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function toBinary(string) {
    const codeUnits = new Uint16Array(string.length);
    for(let i = 0; i < codeUnits.length; i++)codeUnits[i] = string.charCodeAt(i);
    return String.fromCharCode(...new Uint8Array(codeUnits.buffer));
}
function arrayBufferToBase64(arrayBuffer) {
    const decoder = new TextDecoder("utf8");
    const decoded = decoder.decode(arrayBuffer);
    const binaryString = toBinary(decoded);
    return btoa(binaryString);
}
function hashPhoto(photo) {
    const enc = new TextEncoder();
    const array = enc.encode(photo);
    return crypto.subtle.digest("SHA-1", array).then(arrayBufferToBase64);
}
function photoFileName(photo) {
    return hashPhoto(photo).then((hash)=>hash.replace(/_/g, "").replace(/\//g, "").substring(3, 13) + ".png"
    );
}
async function photoToFile(photo) {
    const res = await fetch(photo);
    const buffer = await res.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-1", buffer);
    const hashString = arrayBufferToBase64(hash);
    const fileName = hashString.replace(/_/g, "").replace(/\//g, "").substring(3, 13) + ".png";
    const file = new File([
        buffer
    ], fileName, {
        type: "image/png"
    });
    return file;
}
async function shareDownload(photos) {
    if (!("share" in window.navigator)) //TODO: polyfill this?
    return Promise.resolve(new Error("navigator.share not supported"));
    const files = await Promise.all(photos.map(photoToFile));
    const shareData = {
        files
    };
    return await navigator.share(shareData);
}
function getLangaugePreferences() {
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
console.log({
    languagePrefs
});
function selectL(desc) {
    for (const lang of languagePrefs){
        let selection = desc[lang];
        if (selection) return selection();
    }
    console.error("Missing translation!");
    return "???";
}
const c = (cond, text1)=>cond ? text1 : ""
;
const deleteDatabaseConfirmation = ()=>selectL({
        de: ()=>"Sind Sie sicher, dass Sie alle Daten l\xf6schen wollen?"
        ,
        en: ()=>"Are you sure you want to delete all data?"
    })
;
const gallery1 = ()=>selectL({
        de: ()=>"Galerie"
        ,
        en: ()=>"Gallery"
    })
;
const shop1 = ()=>selectL({
        de: ()=>"Fotoladen"
        ,
        en: ()=>"Shop"
    })
;
const readyForPickup = ()=>selectL({
        de: ()=>"Abhohlbereit!"
        ,
        en: ()=>"Ready for pickup!"
    })
;
const back = ()=>selectL({
        de: ()=>"Zur\xfcck"
        ,
        en: ()=>"Back"
    })
;
const downloadAll = ()=>selectL({
        de: ()=>"Herunterladen"
        ,
        en: ()=>"Download"
    })
;
const instantDevelopmentMode = ()=>selectL({
        de: ()=>"Sofortbildmodus"
        ,
        en: ()=>"Instant camera mode"
    })
;
const pleaseAllowVideoPlayback = ()=>selectL({
        de: ()=>"Hey, bitte d\xfccke diesen Knopf um der App zu erlauben Video darzustellen."
        ,
        en: ()=>"Hey, please press this button to allow the app to show you video."
    })
;
const allow = ()=>selectL({
        de: ()=>"Erlauben"
        ,
        en: ()=>"Allow"
    })
;
const nrOfFilmsInLab = (count)=>{
    const single = count === 1;
    return selectL({
        de: ()=>`Momentan ${single ? "ist" : "sind"} ${count} Film${c(!single, "e")} in der Dunkelkammer`
        ,
        en: ()=>`There ${single ? "is" : "are"} currently ${count} film${c(!single, "s")} in the lab`
    });
};
const day = ()=>selectL({
        de: ()=>"Tag"
        ,
        en: ()=>"day"
    })
;
const days = ()=>selectL({
        de: ()=>"Tagen"
        ,
        en: ()=>"days"
    })
;
const hour = ()=>selectL({
        de: ()=>"Stunde"
        ,
        en: ()=>"hour"
    })
;
const hours = ()=>selectL({
        de: ()=>"Stunden"
        ,
        en: ()=>"hours"
    })
;
const minute = ()=>selectL({
        de: ()=>"Minute"
        ,
        en: ()=>"minute"
    })
;
const minutes = ()=>selectL({
        de: ()=>"Minuten"
        ,
        en: ()=>"minutes"
    })
;
function timeFormat(time) {
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
        de: ()=>"weniger als einer Minute"
        ,
        en: ()=>"under a minute"
    });
}
const filmReadyIn = (time)=>selectL({
        de: ()=>`Abholbereit in ${timeFormat(time)}`
        ,
        en: ()=>`The film will be ready in ${timeFormat(time)}`
    })
;
const CLICK_SOUND_FILE = "./assets/click.flac";
const camera1 = PhotoCamera();
const SHUTTER_SPEED = 0.15;
const leftShutter = creatShutter();
leftShutter.style.left = "0";
const rightShutter = creatShutter();
rightShutter.style.right = "0";
function creatShutter() {
    const shutter = document.createElement("div");
    shutter.style.height = "100%";
    shutter.style.width = "0px";
    shutter.style.background = "black";
    shutter.style.position = "absolute";
    shutter.style.top = "0";
    shutter.style.transition = SHUTTER_SPEED + "s";
    return shutter;
}
function closeAndOpenShutter() {
    leftShutter.style.width = "50px";
    rightShutter.style.width = "50px";
    setTimeout(()=>{
        leftShutter.style.width = "0";
        rightShutter.style.width = "0";
    }, (0.15 + 0.2) * 1000);
}
function adjustViewfinderPosition() {
    const viewfinder = document.getElementById("viewfinder");
    const videoWidth = parseInt(window.getComputedStyle(document.querySelector("#viewfinder video")).width, 10);
    viewfinder.style.left = (document.documentElement.clientWidth - videoWidth) / 2 + "px";
}
function injectViewfinder() {
    const viewfinder = document.getElementById("viewfinder");
    const videoElement = camera1.getVideoElement();
    console.log("adding video player");
    videoElement.style.width = "100px";
    viewfinder.appendChild(leftShutter);
    viewfinder.appendChild(videoElement);
    viewfinder.appendChild(rightShutter);
    adjustViewfinderPosition();
    window.addEventListener("resize", function() {
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
function updateVhCssVariable() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", vh + "px");
}
function executeManualDOMTasks() {
    //Try to inject the viewfinder till it works
    camera1.getVideoElement().addEventListener("canplay", ()=>{
        const viewfinderTryHandle = setInterval(()=>{
            if (tryToInjectViewfinder()) clearInterval(viewfinderTryHandle);
        }, 300);
    });
    //Update the --vh css variable
    window.addEventListener("resize", updateVhCssVariable);
    updateVhCssVariable();
}
var Path;
(function(Path1) {
    Path1["Camera"] = "@#camera";
    Path1["Shop"] = "@#shop";
    Path1["Gallery"] = "@#gallery";
})(Path || (Path = {
}));
const AskForVideoPermission = (state)=>({
        ...state,
        showVideoPermissionPopup: true
    })
;
const GotVideoPermission = (state)=>[
        {
            ...state,
            showVideoPermissionPopup: false
        },
        [
            ()=>{
                camera1.forcePlay();
            }, 
        ], 
    ]
;
const TakePhoto = (state)=>[
        state,
        [
            (dispatch)=>{
                if (!camera1.isPlaying()) {
                    dispatch(AskForVideoPermission);
                    return;
                }
                const pic = camera1.snap();
                closeAndOpenShutter();
                globalAudioPlayer.play(CLICK_SOUND_FILE);
                db.addPhotoToActiveFilm(pic).then((film)=>{
                    dispatch(NewPhotoTaken, film);
                });
            }, 
        ], 
    ]
;
const DownloadPhoto = (state, photo)=>[
        state,
        [
            ()=>{
                photoFileName(photo).then((name)=>{
                    download(photo, name);
                });
            }, 
        ], 
    ]
;
const FilmsInDevelopmentChanged = (state, filmsInDevelopment)=>{
    return {
        ...state,
        filmsInDevelopment
    };
};
const ResetDb = (state)=>[
        state,
        [
            ()=>{
                if (window.confirm(deleteDatabaseConfirmation())) {
                    db.deleteDatabase();
                    window.location.reload();
                }
            }, 
        ], 
    ]
;
const NewFilmWasInserted = (state, newFilm)=>({
        ...state,
        activeFilm: newFilm
    })
;
const UpdateTime = (state)=>({
        ...state,
        currentTime: Date.now()
    })
;
const ChangeZeroDevelopmentMode = (state, event)=>({
        ...state,
        zeroDevelopmentTime: event.target.checked
    })
;
const NewPhotoTaken = (state, film)=>[
        {
            ...state,
            activeFilm: film
        },
        film.photos.length >= film.frames && [
            (dispatch)=>{
                db.addFilm().then((newFilmId)=>{
                    Promise.all([
                        db.setActiveFilmId(newFilmId),
                        db.loadFilm(newFilmId)
                    ]).then(([, newFilm])=>{
                        dispatch(NewFilmWasInserted, newFilm);
                        db.addDevelopmentStartTimeStampToFilm(film.id, Date.now()).then(()=>db.loadAllFilmsInDevelopment().then((films)=>{
                                dispatch(FilmsInDevelopmentChanged, films);
                            })
                        );
                    });
                });
            }, 
        ], 
    ]
;
const DevelopedFilmWasCollected = (state, filmId)=>[
        {
            ...state
        },
        [
            (dispatch)=>{
                db.developFilm(filmId).then((developedFilm)=>{
                    db.loadAllFilmsInDevelopment().then((films)=>{
                        dispatch(FilmsInDevelopmentChanged, films);
                    });
                    Promise.all(developedFilm.photos.map((photoId)=>db.loadPhoto(photoId)
                    )).then((photos)=>dispatch(EnterGallery, photos)
                    );
                });
            }, 
        ], 
    ]
;
const EnterGallery = (state, galleryImages)=>({
        ...state,
        path: Path.Gallery,
        galleryImages
    })
;
const ExitGallery = (state)=>({
        ...state,
        path: Path.Camera
    })
;
const AddPhotoToGallery = (state, { photo , index  })=>{
    let newGalleryImages = [
        ...state.galleryImages
    ];
    newGalleryImages[index] = photo;
    return {
        ...state,
        galleryImages: newGalleryImages
    };
};
const EnterShop = (state)=>({
        ...state,
        path: Path.Shop
    })
;
const ExitShop = (state)=>({
        ...state,
        path: Path.Camera
    })
;
const EnterMainGallery = (state)=>[
        {
            ...state
        },
        [
            (dispatch)=>{
                db.loadDevelopedPhotoIds().then((photoIds)=>{
                    dispatch(EnterGallery, new Array(photoIds.length));
                    photoIds.forEach((photoId, index)=>{
                        db.loadPhoto(photoId).then((photo)=>dispatch(AddPhotoToGallery, {
                                index,
                                photo
                            })
                        );
                    });
                });
            }, 
        ], 
    ]
;
const DownloadGalleryDone = (state)=>({
        ...state,
        galleryDownloadInProgress: false
    })
;
const StartDownloadGallery = (state)=>[
        {
            ...state,
            galleryDownloadInProgress: true
        },
        [
            (dispatch)=>{
                db.loadAllDevelopedPhotos().then((photos)=>{
                    shareDownload(photos).then(()=>dispatch(DownloadGalleryDone)
                    );
                });
            }, 
        ], 
    ]
;
const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;
const DEVELOPMENT_TIME = 0.5 * HOURS;
const rootComponent = (state)=>h("main", {
        style: {
            overflow: "hidden"
        }
    }, [
        h("div", {
            class: "camera-and-shop",
            style: {
                marginTop: state.path === Path.Gallery ? "calc(var(--vh, 1vh) * -100)" : "0",
                marginLeft: state.path === Path.Shop ? "-100vw" : "0",
                position: "relative"
            }
        }, [
            h("div", {
                id: "viewfinder",
                style: {
                    position: "absolute",
                    top: "0"
                }
            }),
            camera2(state),
            shop2(state), 
        ]),
        gallery2(state),
        videoPermissionPopup(state.showVideoPermissionPopup), 
    ])
;
const camera2 = (state)=>h("div", {
        class: "camera"
    }, [
        h("div", {
            class: "camera__top-panel"
        }, [
            filmIndicator(state),
            h("button", {
                onclick: TakePhoto,
                class: "snap-button"
            })
        ]),
        h("div", {
            class: "camera__bottom-panel"
        }, [
            h("div", {
                class: "camera__info-area"
            }, [
                filmLab(state)
            ]),
            h("div", {
                class: "camera__button-bar"
            }, [
                h("button", {
                    class: "p-button",
                    onclick: EnterMainGallery
                }, [
                    text(gallery1())
                ]),
                h("button", {
                    class: "p-button",
                    onclick: EnterShop
                }, [
                    text(shop1())
                ]),
                h("button", {
                    class: "p-button",
                    onclick: ResetDb
                }, [
                    text("RESET")
                ]), 
            ]), 
        ]), 
    ])
;
const filmIndicator = ({ activeFilm  })=>h("div", {
        class: "film-state"
    }, [
        ...Array.from({
            length: activeFilm.photos.length
        }, ()=>h("div", {
                class: "photo-in-film-used"
            })
        ),
        ...Array.from({
            length: activeFilm.frames - activeFilm.photos.length
        }, ()=>h("div", {
                class: "photo-in-film-free"
            })
        ), 
    ])
;
const filmLab = ({ filmsInDevelopment , zeroDevelopmentTime , currentTime  })=>h("div", {
        style: {
            marginTop: "1rem"
        }
    }, [
        text(nrOfFilmsInLab(filmsInDevelopment.length)),
        h("ul", {
            style: {
                paddingLeft: "1rem",
                lineHeight: "2",
                marginTop: "0.5rem"
            }
        }, filmsInDevelopment.map((film)=>filmLabItem(film, zeroDevelopmentTime, currentTime)
        )), 
    ])
;
const filmLabItem = (film, zeroDevelopmentTime, currentTime)=>{
    const timeInDevelopment = currentTime - film.developmentStartDate;
    const timeLeft = DEVELOPMENT_TIME - timeInDevelopment;
    let isDone = timeLeft <= 0;
    if (zeroDevelopmentTime) isDone = true;
    return h("li", {
        style: {
            marginBottom: "0.3rem"
        }
    }, [
        isDone ? h("button", {
            onclick: [
                DevelopedFilmWasCollected,
                film.id
            ],
            class: "p-button"
        }, [
            text(readyForPickup())
        ]) : text(filmReadyIn(timeLeft)), 
    ]);
};
const galleryImagesList = ({ galleryImages  })=>h("div", {
        class: "p-card",
        style: {
            marginBottom: "1rem"
        }
    }, galleryImages.map((photo)=>h("img", {
            src: photo,
            class: "gallery__photo",
            onclick: [
                DownloadPhoto,
                photo
            ]
        })
    ))
;
const gallery2 = ({ galleryImages , galleryDownloadInProgress  })=>h("div", {
        class: "gallery"
    }, [
        h("div", {
            class: "p-card flex-row",
            style: {
                alignItems: "center",
                marginBottom: "1rem"
            }
        }, [
            h("h3", {
                style: {
                    flex: "1"
                }
            }, [
                text(gallery1())
            ]),
            h("button", {
                class: "p-button",
                onclick: StartDownloadGallery
            }, [
                text(downloadAll()),
                galleryDownloadInProgress && h("div", {
                    class: "p-spinner"
                }), 
            ]),
            h("button", {
                class: "p-button",
                onclick: ExitGallery
            }, [
                text(back())
            ]), 
        ]),
        galleryImagesList({
            galleryImages
        }), 
    ])
;
const shop2 = (state)=>h("div", {
        class: "shop flex-column"
    }, [
        h("h1", {
        }, [
            text(shop1())
        ]),
        h("div", {
            style: {
                flex: "1"
            }
        }, [
            h("label", {
                style: {
                    display: "flex"
                }
            }, [
                text(instantDevelopmentMode()),
                h("input", {
                    style: {
                        marginLeft: "1rem"
                    },
                    type: "checkbox",
                    checked: state.zeroDevelopmentTime,
                    onchange: ChangeZeroDevelopmentMode
                }), 
            ]),
            debugView(state),
            h("button", {
                onclick: AskForVideoPermission,
                class: "p-button"
            }, [
                text("popuptest")
            ]), 
        ]),
        h("button", {
            onclick: ExitShop,
            class: "p-button"
        }, [
            text(back())
        ]), 
    ])
;
const debugView = ({ filmsInDevelopment , activeFilm  })=>h("details", {
        class: "p-card",
        style: {
            margin: "1rem 0"
        }
    }, [
        h("summary", {
            style: {
                fontWeight: "bold"
            }
        }, [
            text("Debug")
        ]),
        h("pre", {
        }, [
            text(JSON.stringify({
                filmsInDevelopment,
                activeFilm
            }, null, 2))
        ]), 
    ])
;
const videoPermissionPopup = (showVideoPermissionPopup)=>h("div", {
        class: "flex-column",
        style: {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100vw",
            height: "calc(var(--vh, 1vh) * 100)",
            alignItems: "center",
            justifyContent: "center",
            background: showVideoPermissionPopup ? "rgba(0.3,0.3,0.3,0.6)" : "transparent",
            transition: "0.3s",
            pointerEvents: showVideoPermissionPopup ? "auto" : "none"
        }
    }, [
        h("div", {
            class: "p-card flex-column",
            style: {
                padding: "2rem",
                marginTop: showVideoPermissionPopup ? "0" : "-200vh",
                transform: "scale(" + (showVideoPermissionPopup ? "1" : "0.3") + ")",
                "--movingTime": "0.3s",
                "--transformingTime": "0.1s",
                transition: showVideoPermissionPopup ? "margin var(--movingTime) 0s, transform var(--transformingTime) var(--movingTime)" : "margin var(--movingTime) var(--transformingTime), transform var(--transformingTime) 0s"
            }
        }, [
            h("p", {
                style: {
                    paddingBottom: "2rem"
                }
            }, [
                text(pleaseAllowVideoPlayback()), 
            ]),
            h("button", {
                class: "p-button primary",
                onclick: GotVideoPermission
            }, [
                text(allow()), 
            ]), 
        ]), 
    ])
;
executeManualDOMTasks();
const intervalSubscriber = (dispatch, { time , action  })=>{
    let handle = setInterval(()=>{
        dispatch(action);
    }, time);
    return ()=>clearInterval(handle)
    ;
};
const onInterval = (time, action)=>[
        intervalSubscriber,
        {
            time,
            action
        }, 
    ]
;
async function initApp() {
    await initdb();
    const [initialActiveFilm, initialFilmsInDevelopment] = await Promise.all([
        db.loadActiveFilm(),
        db.loadAllFilmsInDevelopment(),
        globalAudioPlayer.load(CLICK_SOUND_FILE), 
    ]);
    app({
        init: {
            activeFilm: initialActiveFilm,
            filmsInDevelopment: initialFilmsInDevelopment,
            galleryImages: [],
            path: Path.Camera,
            currentTime: Date.now(),
            zeroDevelopmentTime: false,
            showVideoPermissionPopup: false,
            galleryDownloadInProgress: false
        },
        view: (state)=>{
            console.log("State before render is", state);
            return rootComponent(state);
        },
        node: document.getElementById("container"),
        subscriptions: (state)=>[
                state.path === Path.Camera && onInterval(10000, UpdateTime)
            ]
    });
}
initApp();
