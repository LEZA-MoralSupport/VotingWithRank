/* Firebase initializer (browser-friendly)
   - Paste your firebaseConfig object below to enable Firestore.
   - This file uses the CDN compat SDKs so you don't need to npm install anything.
*/

window.firebaseConfig = {
    apiKey: "AIzaSyBBlhr1BLt_AjEWrJSBUON6Vb5gYD2MgPg",
    authDomain: "vote-for-subject.firebaseapp.com",
    projectId: "vote-for-subject",
    storageBucket: "vote-for-subject.firebasestorage.app",
    messagingSenderId: "278518905205",
    appId: "1:278518905205:web:c3dbfe97ab4548e2b7bb3c",
    measurementId: "G-J63C8W5208"
  };
window.loadFirebase = function(callback) {
    if (!window.firebaseConfig) {
        console.log('Firebase config not provided - skipping Firebase init.');
        if (typeof callback === 'function') callback(false);
        return;
    }

    // Load SDKs
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js';
    document.head.appendChild(s1);
    const s2 = document.createElement('script');
    s2.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js';
    document.head.appendChild(s2);

    s2.onload = () => {
        try {
            firebase.initializeApp(window.firebaseConfig);
            window.db = firebase.firestore();
            console.log('Firebase initialized');
            if (typeof callback === 'function') callback(true);
        } catch (e) {
            console.error('Firebase init failed', e);
            if (typeof callback === 'function') callback(false);
        }
    };
};

// Convenience helpers: writeVote (atomic increment), getAllVotes, watchVotes
// These use the compat SDK (firebase.firestore.FieldValue.increment)

window.writeVote = function(teamId, meta = {}, increment = 1) {
    // Ensure Firebase is loaded
    if (!window.db) {
        window.loadFirebase(function(ok) {
            if (ok) window.writeVote(teamId, meta, increment);
            else console.warn('Firebase not initialized; cannot write vote');
        });
        return Promise.reject(new Error('Firebase not initialized'));
    }

    const ref = window.db.collection('votes').doc(teamId);
    const payload = Object.assign({}, meta, { score: firebase.firestore.FieldValue.increment(increment) });
    return ref.set(payload, { merge: true })
        .then(() => {
            console.log(`wrote vote for ${teamId}`);
            return true;
        })
        .catch(err => {
            console.error('writeVote failed', err);
            throw err;
        });
};

window.getAllVotes = function() {
    if (!window.db) {
        return new Promise((resolve, reject) => {
            window.loadFirebase(function(ok) {
                if (ok) window.getAllVotes().then(resolve).catch(reject);
                else reject(new Error('Firebase not initialized'));
            });
        });
    }
    return window.db.collection('votes').get().then(snapshot => {
        const out = {};
        snapshot.forEach(doc => out[doc.id] = doc.data());
        return out;
    });
};

// watchVotes(callback) -> returns unsubscribe function
window.watchVotes = function(callback) {
    if (!window.db) {
        // initialize then attach
        let unsub = null;
        window.loadFirebase(function(ok) {
            if (ok) {
                unsub = window.watchVotes(callback);
            } else {
                console.warn('Firebase not initialized; cannot watch votes');
            }
        });
        // return a dummy unsubscriber that does nothing until real one is set
        return function() { if (typeof unsub === 'function') unsub(); };
    }

    const listener = window.db.collection('votes').onSnapshot(snapshot => {
        const out = {};
        snapshot.forEach(doc => out[doc.id] = doc.data());
        try { callback(out); } catch (e) { console.error('watchVotes callback error', e); }
    }, err => console.error('watchVotes snapshot error', err));

    return listener; // Firestore onSnapshot returns an unsubscribe function
};
