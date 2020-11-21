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
	const store = transaction.objectStoree('pendingTransac');
	//add record to the store
	store.add(record);
}

//get record
function checkIndexdb() {
	//open a transaction on objectStore
	const transaction = db.transaction('pendingTransac', 'readwrite');
	//access the objectStore
	const store = transaction.objectStoree('pendingTransac');
	//get all records from the store
	const getAll = store.getAll();

	//If getAll is successful, then POST the records
	getAll.onsuccess = function() {
		if (getAll.result.length > 0) {
			fetch('api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				header: {
					accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				}
			})
				.then((response) => response.json())
				.then(() => {
					//clear indexdb store after successful POST
					const transaction = db.transaction('pendingTransac', 'readwrite');
					const store = transaction.store('pendingTransac');
					store.clear();
				});
		}
	};
}

//listen for app back online
window.addEventListener('online', checkIndexdb);

/*
let db;
// create a new db request for a "budget" database.
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
	// create object store called "pending" and set autoIncrement to true
	const db = event.target.result;
	db.createObjectStore('pending', { autoIncrement: true });
};

request.onsuccess = function(event) {
	db = event.target.result;

	// check if app is online before reading from db
	if (navigator.onLine) {
		checkDatabase();
	}
};

request.onerror = function(event) {
	console.log('Woops! ' + event.target.errorCode);
};

function saveRecord(record) {
	// create a transaction on the pending db with readwrite access
	const transaction = db.transaction([ 'pending' ], 'readwrite');

	// access your pending object store
	const store = transaction.objectStore('pending');

	// add record to your store with add method.
	store.add(record);
}

function checkDatabase() {
	// open a transaction on your pending db
	const transaction = db.transaction([ 'pending' ], 'readwrite');
	// access your pending object store
	const store = transaction.objectStore('pending');
	// get all records from store and set to a variable
	const getAll = store.getAll();

	console.log(getAll);

	getAll.onsuccess = function() {
		if (getAll.result.length > 0) {
			fetch('/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain,',
					'Content-Type': 'application/json'
				}
			})
				.then((response) => response.json())
				.then(() => {
					// if successful, open a transaction on your pending db
					const transaction = db.transaction([ 'pending' ], 'readwrite');

					// access your pending object store
					const store = transaction.objectStore('pending');

					// clear all items in your store
					store.clear();
				});
		}
	};
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
*/
