//set a global var db
let db;

//create a new request for indexDB database
const request = indexedDB.open('budget', 1);

//upon onupgradeneeded, open an objectStore
request.onupgradeneeded = function(event) {
	db = event.target.result;
	db.createObjectStore('pendingTransac', { autoIncrement: true });
};

//upon onsuccess
request.onsuccess = function(event) {
	db = event.target.result;
	if (window.onLine) {
		checkIndexdb();
	}
};

//upon onerror
request.onerror = function(event) {
	console.log(event.target.error);
};

//save to record when the app transaction fails
function saveRecord(record) {
	//create a transaction on the objectStore with readwrite access
	const transaction = db.transaction('pendingTransac', 'readwrite');
	//access the objectStore
	const store = transaction.objectStore('pendingTransac');
	//add record to the store
	store.add(record);
}

//get record
function checkIndexdb() {
	//open a transaction on objectStore
	const transaction = db.transaction('pendingTransac', 'readwrite');
	//access the objectStore
	const store = transaction.objectStore('pendingTransac');
	//get all records from the store
	const getAll = store.getAll();

	console.log(getAll);

	//If getAll is successful, then POST the records
	getAll.onsuccess = function() {
		if (getAll.result.length > 0) {
			fetch('/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				}
			})
				.then((response) => response.json())
				.then(() => {
					//clear indexdb store after successful POST
					const transaction = db.transaction([ 'pendingTransac' ], 'readwrite');

					// access object store
					const store = transaction.objectStore('pendingTransac');

					// clear all items in object store
					store.clear();
				});
		}
	};
}

//listen for app back online
window.addEventListener('online', checkIndexdb);
