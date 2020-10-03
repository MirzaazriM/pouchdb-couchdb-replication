

function createUser() {
    let userOne = {
        //'_id': new Date().toISOString(), // only if we use 'put' instead of 'post'
        'name': 'Mirza ' + Math.floor(Math.random() * 1000),
        'last_name': 'Oglecevac ' + Math.floor(Math.random() * 1000),
        'hobbies': [
            'chess',
            'programming'
        ],
        'encryption': false
    };

    addDataToDatabase(db, userOne);
}

function createEncryptedUser() {
    let userOne = {
        //'_id': new Date().toISOString(), // only if we use 'put' instead of 'post'
        'name': 'Azrim ' + Math.floor(Math.random() * 1000),
        'last_name': 'Ogledov ' + Math.floor(Math.random() * 1000),
        'hobbies': [
            'chess',
            'programming'
        ],
        'encryption': true
    };

    addDataToDatabase(db, userOne);
}

function addDataToDatabase(db, jsonObject) {

    db.post(jsonObject)
        .then(function(data) {
            console.log("In promise: ", data);
        })

        .catch(function (error) {
            console.log("Error: ", error);
    });
}


function showUsers(db) {

    db.allDocs(
        {
            'include_docs': true,
            'descending': true,
            'attachments': true
        }
    ).then(function(data) {
        console.log("Data: ", data.rows);

        let text = '';
        let rows = data.rows;
        for (let i = 0; i < rows.length; i++) {

            text += '<div> Id: ' + rows[i].doc._id + ',  ' + ' Name: ' + rows[i].doc.name +
                '&nbsp;<button onclick="deleteUser(db,\'' + rows[i].doc._id + '\')">Delete user</button>' + '</div>' +
                '<br/>';

        }

        document.getElementById('content').innerHTML = text;

    }).catch(function (error) {
        console.log("Error: ", error);
    });
}

function deleteUser(db, docId) {

    // first get the document
    db.get(docId).then(function (data) {
        console.log(data);
        return db.remove(data);
    }).catch(function (error) {
        console.log("Error fetch: ", error);
    });

}

function syncWithRemoteDB() {


}

function getChangesFrom(db) { // can be 0, 'now'

    let changesFrom = document.getElementById('changesFromValue').value;
    if (changesFrom === null || changesFrom === undefined) {
        changesFrom = 0;
    }

    db.changes({
        'since': changesFrom, //168,
        'include_docs': true
    }).then(function (change) {
        console.log("CHANGE FOUND");
        //console.log("Changes: ", change);

        if (change.deleted) {
            // document was deleted
        } else {
            // document was added/modified
        }

        let docs = change.results;
        let lastDoc = docs[docs.length - 1].doc;
        console.log(lastDoc);

        if (lastDoc.encryption !== undefined && lastDoc.encryption !== false) {
            console.log("Sending AJAX request to Laravel API");
        }

        // for (let i = 0; i < docs.length; i++) {
        //     console.log(docs[i]);
        // }

    }).catch(function (error) {
        console.log("Error: ", error);
    });

}

function listenToChanges(db) {

    db.changes({
        'since': 'now',
        'include_docs': true
    }).on('change', function (change) {
        console.log("CHANGE FOUND");
        console.log("Changes: ", change);

        if (change.deleted) {
            // document was deleted
        } else {
            // document was added/modified
        }

    }).on('error', function (error) {
        console.log("Error: ", error);
    });
}

function replicateToRemoteCouchDB(pouchDbDatabase) {

    PouchDB.replicate(pouchDbDatabase, 'http://127.0.0.1:5984/users_pouch', {
        //live: true,
        retry: true,
        filter: '_view',
        view: 'encryption_filter/encryption_filter_view'
        //query_params: {encryption: false}
    }).on('change', function (data) {

        console.log("Replicating change ", data);
        // handle change
    }).on('paused', function (err) {
        console.log("Replication paused ", err);
        // replication paused (e.g. replication up to date, user went offline)
    }).on('active', function () {
        console.log("Replication active");
        // replicate resumed (e.g. new changes replicating, user went back online)
    }).on('denied', function (err) {
        console.log("Replication denied ", err);
        // a document failed to replicate (e.g. due to permissions)
    }).on('complete', function (info) {
        console.log("Replication complete ", err);
        // handle complete
    }).on('error', function (err) {
        console.log("Replication error ", err);
        // handle error
    });

    //rep.cancel(); // whenever you want to cancel
}


function replicateFromRemoteCouchDB(pouchDbDatabase) {
    PouchDB.replicate('http://127.0.0.1:5984/users_pouch', pouchDbDatabase, {
        //live: true,
        retry: true,
        filter: '_view',
        view: 'encryption_filter/encryption_filter_view'
        // filter: '_view',
        // view: 'encryption_filter/encryption_filter_view'
        //query_params: {encryption: false}
    }).on('change', function (data) {
        console.log("Replicating remote change ", data);
        // handle change
    }).on('paused', function (err) {
        console.log("Replication remote paused ", err);
        // replication paused (e.g. replication up to date, user went offline)
    }).on('active', function () {
        console.log("Replication remote active");
        // replicate resumed (e.g. new changes replicating, user went back online)
    }).on('denied', function (err) {
        console.log("Replication remote denied ", err);
        // a document failed to replicate (e.g. due to permissions)
    }).on('complete', function (info) {
        console.log("Replication remote complete ", err);
        // handle complete
    }).on('error', function (err) {
        console.log("Replication remote error ", err);
        // handle error
    });
}


// function fetchDataThroughFilter(db) {
//     db.query('encryption_filter/encryption_filter_view', {
//         //limit: 0 // don't return any results
//     }).then(function (res) {
//         // index was built!
//     }).catch(function (err) {
//         // some error
//     });
// }


// CREATED ON BACKEND
// function createEncryptionFilterDesignDocument(pouchDB) {
//
//     // document that tells PouchDB/CouchDB
//     // to build up an index on doc.name
//     var ddoc = {
//         _id: '_design/encryption_filter',
//         views: {
//             encryption_filter_view: {
//                 map: function (doc) {
//                     if (doc.encryption == undefined || doc.encryption == false) {
//                         emit(doc._id, doc);
//                     }
//                 }
//             }
//         }
//     };
//
//     // save it
//     pouchDB.put(ddoc).then(function () {
//         console.log("Encryption filter created");
//     }).catch(function (err) {
//         console.log("Filter couldnt be created - maybe already exist ", err);
//     });
//
// }