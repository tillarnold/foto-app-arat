import { PhotoCamera } from './camera.js';
import { timeStamp, repeat } from './utils.js'
import { persistent_value, PhotoDB } from './persistence.js'
import { h, text, app } from "./vendor/hyperapp-2.0.18.js"

/*

const PICTURES_IN_FILM = 8;
const DEVELOPMENT_TIME = 3000;
const DB_NAME = 'photodata';


persistent_value(DB_NAME, { currentFilm: [], oldFilms: [], developedPhotos: [] }, (data, persist) => {
    const camera = PhotoCamera();
    const filmIndicator = FilmStateIndicator(PICTURES_IN_FILM);
    const labIndicator = PhotoLabIndicator(labDoneButtonCb);
    const gallery = Gallery();

    const camera_container = document.getElementById("camera-mode");
    const root_container = document.getElementById("container");

    const triggerButton = document.createElement("button");
    triggerButton.className = "snap-button";
    triggerButton.innerText = "Snap!";
    const galleryButton = document.createElement("button");
    galleryButton.className = "gallery-button";
    galleryButton.innerText = "Gallery";

    updateIndicators();
    gallery.hide();

    camera_container.appendChild(filmIndicator.getElement())
    camera_container.appendChild(triggerButton);
    camera_container.appendChild(labIndicator.getElement())
    camera_container.appendChild(galleryButton);

    root_container.appendChild(gallery.getElement());

    galleryButton.addEventListener('click', () => {
        showGalleryWith(data.developedPhotos);
    });

    gallery.getBackButton().addEventListener('click', () => {
        gallery.hide();
        camera_container.style.display = 'block';
    });

    function showGalleryWith(images) {
        gallery.setImages(images);
        gallery.show();
        camera_container.style.display = 'none';
    }

    triggerButton.addEventListener('click', () => {
        let picturedata = camera.snap();
        addPhoto(picturedata)
        updateIndicators()
    });

    let triggerButtonPressStart = null;

    triggerButton.addEventListener('touchstart', () => {
        triggerButtonPressStart = Date.now();
    });

    triggerButton.addEventListener('mousedown', () => {
        triggerButtonPressStart = Date.now();
    });

    triggerButton.addEventListener('touchend', triggerReset);
    triggerButton.addEventListener('mouseup', triggerReset);

    function triggerReset(event) {
        const delta = Date.now() - triggerButtonPressStart;
        if (delta > 2000) {
            if (confirm("reset?")) {
                indexedDB.deleteDatabase(DB_NAME)
                window.location.reload()
            }
            event.stopPropagation()
            event.preventDefault();
        }

    }


    filmIndicator.getElement().addEventListener('click', () => {
        document.getElementById("container").requestFullscreen()
    })

    function updateIndicators() {
        filmIndicator.setCount(data.currentFilm.length);
        labIndicator.setFilms(data.oldFilms);
    }


    function finishedDevelopment(filmIndexes) {
        if (filmIndexes.length > 0) {
            console.log("the films", filmIndexes, "has finished developing")
            const oldFilms = data.oldFilms;
            for (const index of filmIndexes) {
                const film = oldFilms.splice(index, 1)[0];
                let pictures = film.data;
                for (let i = 0; i < pictures.length; i++) {
                    data.developedPhotos.push(pictures[i])
                    //download(pictures[i], "img-"+i+".png")
                }
            }
            persist();
            updateIndicators();
        }
    }

    function labDoneButtonCb(index) {
        const photos = data.oldFilms[index];
        finishedDevelopment([index]);
        showGalleryWith(photos.data)
    }

    setInterval(updateIndicators, 3000);


    function addPhoto(photo) {

        const currentFilm = data.currentFilm;
        currentFilm.push(photo);

        if (currentFilm.length >= PICTURES_IN_FILM) {
            const oldFilms = data.oldFilms;
            oldFilms.push({ date: timeStamp(), data: currentFilm });
            data.currentFilm = [];
        }
        persist();
        console.log(data)
    }
});


function Gallery() {
    const container = document.createElement("div");
    const imagesContainer = document.createElement("div");
    const returnButton = document.createElement("button");
    returnButton.innerText = "back";
    returnButton.className = "return-button";
    container.appendChild(returnButton);
    container.appendChild(imagesContainer);

    function setImages(images) {
        imagesContainer.innerHTML = '';
        for (const imgpath of images) {
            const img = document.createElement("img");
            img.className = "gallery-photo"
            img.src = imgpath;
            imagesContainer.appendChild(img)
        }
    }

    function show() {
        container.style.display = 'block';
    }

    function hide() {
        container.style.display = 'none';
    }

    return {
        getElement: () => container,
        setImages,
        getBackButton: () => returnButton,
        show,
        hide
    }

}

function PhotoLabIndicator(buttonCb) {
    const photolabDiv = document.createElement("div");
    const overviewDiv = document.createElement("div");
    const filmsDiv = document.createElement("ul");
    photolabDiv.appendChild(overviewDiv);
    photolabDiv.appendChild(filmsDiv);

    function setFilms(films) {
        overviewDiv.innerText = `Currently there are ${films.length} films in development`
        filmsDiv.innerHTML = '';
        for (const [filmIndex, film] of films.entries()) {
            const filmDiv = document.createElement("li");
            const sent_date = new Date(film.date);
            const time_till_done = DEVELOPMENT_TIME - (Date.now() - film.date);
            const minutes_till_done = Math.ceil(time_till_done / 1000 / 60);
            if (time_till_done >= 0) {
                filmDiv.innerText = `Sent to develop at ${sent_date.toLocaleString()} and will be done in ${minutes_till_done} minutes`;
            }
            else {
                filmDiv.innerText = "done"
                const openButton = document.createElement("button")
                openButton.innerText = "show";
                filmDiv.appendChild(openButton)
                openButton.addEventListener('click', () => {
                    buttonCb(filmIndex)
                });
            }
            filmsDiv.appendChild(filmDiv);
        }
    }

    return {
        getElement: () => photolabDiv,
        setFilms,
    }
}

function FilmStateIndicator(size) {
    const filmStateDiv = document.createElement("div");
    filmStateDiv.className = "film-state";

    for (let i = 0; i < size; i++) {
        let newChild = document.createElement("div");
        newChild.className = "photo-in-film-used";
        filmStateDiv.appendChild(newChild);
    }



    function setCount(nr) {
        let cnt = 0;
        for (let child of filmStateDiv.childNodes) {
            cnt++;
            if (cnt > nr) {
                child.className = "photo-in-film-free";
            } else {
                child.className = "photo-in-film-used";
            }

        }
    }

    return {
        getElement: () => filmStateDiv,
        setCount
    }

}

*/


const camera = PhotoCamera();

PhotoDB(db => {
    window.pdb = db;

    const AddTodo = (state) => ({
        ...state,
        value: "",
        todos: state.todos.concat(state.value),
        usedFrames: state.usedFrames + 1,
    })

    const NewValue = (state, event) => ({
        ...state,
        value: event.target.value,
    })

    const TakePhoto = (state) => [{ ...state }, [dispatch => {
        const pic = camera.snap();
        db.addPhotoToActiveFilm(pic).then(film => {
            dispatch(NewPhotoTaken, film)
        })
    }]];

    const NewPhotoTaken = (state, film) => ({
        ...state,
        usedFrames: film.photos.length
    })

    const film_indicator = ({ usedFrames, totalFrames }) => h("div", { class: "film-state" }, [
        ...Array.from({ length: usedFrames }, () => h("div", { class: "photo-in-film-used" })),
        ...Array.from({ length: totalFrames - usedFrames }, () => h("div", { class: "photo-in-film-free" })),
    ]);

    const film_lab = ({ filmsInDevelopment }) => h("div", {}, [
        text(`There are currently ${filmsInDevelopment.length} films in the lab`),
        h("ul", {},
            filmsInDevelopment.map(film_lab_item)
        )

    ]);

    const film_lab_item = film => h("li", {}, text(`The film was sent for development at ${film.date}`));

    app({
        init: {
            todos: [],
            value: "",
            usedFrames: 4,
            totalFrames: 12,
            filmsInDevelopment: [{ date: Date.now() }],
        },
        view: (state) =>
            h("main", {}, [
                h("h1", {}, text("To do list")),
                h("button", { onclick: TakePhoto }, text("Snap")),
                film_indicator(state),
                film_lab(state),
                h("input", { type: "text", oninput: NewValue, value: state.value }),
                h("ul", {},
                    state.todos.map((todo) => h("li", {}, text(todo)))
                ),
                h("button", { onclick: AddTodo }, text("New!")),
            ]),
        node: document.getElementById("container"),
    })

})




