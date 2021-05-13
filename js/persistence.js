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