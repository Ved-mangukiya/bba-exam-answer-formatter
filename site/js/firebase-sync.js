/**
 * Firebase Realtime Database Sync Module
 * Synchronizes question checklist and 10 SPI study schedule across devices.
 */
(function() {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyBqJ00apnAK9Jm3fdu7r7yCnvJGzJ1NpxE",
    authDomain: "bba-study-tracker.firebaseapp.com",
    databaseURL: "https://bba-study-tracker-default-rtdb.firebaseio.com",
    projectId: "bba-study-tracker",
    storageBucket: "bba-study-tracker.firebasestorage.app",
    messagingSenderId: "525498643899",
    appId: "1:525498643899:web:7d80e73f825aac6476409e",
    measurementId: "G-8KNLMYPFBZ"
  };

  let db = null;
  let syncRef = null;
  let isLocalWrite = false;
  let onDataCallback = null;
  let onStatusCallback = null;
  let getLocalDataFn = null;
  let isInitialLoad = true;

  const FirebaseSync = {
    init: function(options) {
      options = options || {};
      onDataCallback = options.onData;
      onStatusCallback = options.onStatus;
      getLocalDataFn = options.getLocalData;

      if (typeof firebase === 'undefined') {
        console.warn('[FirebaseSync] Firebase SDK not loaded. Working in offline mode.');
        if (onStatusCallback) onStatusCallback('offline', 'Offline (Local)');
        return;
      }

      try {
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();
        syncRef = db.ref('studyTracker');

        if (onStatusCallback) onStatusCallback('connecting', 'Connecting...');

        // Monitor Realtime Database connection state
        const connectedRef = db.ref('.info/connected');
        connectedRef.on('value', (snap) => {
          if (snap.val() === true) {
            console.log('[FirebaseSync] Connected to Firebase Realtime Database.');
            if (onStatusCallback) onStatusCallback('synced', 'Cloud Synced');
          } else {
            console.log('[FirebaseSync] Offline from Firebase.');
            if (onStatusCallback) onStatusCallback('offline', 'Offline (Local)');
          }
        });

        // Listen for live database changes across all devices
        syncRef.on('value', (snapshot) => {
          if (isLocalWrite) {
            // Write originated from this browser tab, skip applying back
            isLocalWrite = false;
            return;
          }

          const val = snapshot.val();
          if (val === null) {
            // Cloud is blank on fresh install; seed with existing local data if any
            if (isInitialLoad && getLocalDataFn) {
              isInitialLoad = false;
              const localData = getLocalDataFn();
              if ((localData.checkedQuestions && localData.checkedQuestions.length > 0) ||
                  (localData.completedDays && localData.completedDays.length > 0)) {
                console.log('[FirebaseSync] Initializing remote database with local progress...');
                FirebaseSync.saveProgress(localData.checkedQuestions, localData.completedDays);
              }
            }
            return;
          }

          isInitialLoad = false;
          if (onDataCallback) {
            onDataCallback({
              checkedQuestions: Array.isArray(val.checkedQuestions) ? val.checkedQuestions : [],
              completedDays: Array.isArray(val.completedDays) ? val.completedDays : []
            });
          }
          if (onStatusCallback) onStatusCallback('synced', 'Cloud Synced');
        }, (error) => {
          console.error('[FirebaseSync] Realtime sync error:', error);
          if (onStatusCallback) onStatusCallback('error', 'Sync Error');
        });

      } catch (err) {
        console.error('[FirebaseSync] Initialization error:', err);
        if (onStatusCallback) onStatusCallback('error', 'Sync Failed');
      }
    },

    saveProgress: function(checkedQuestions, completedDays) {
      if (!syncRef) return;
      isLocalWrite = true;
      if (onStatusCallback) onStatusCallback('saving', 'Saving...');

      const payload = {
        checkedQuestions: Array.from(checkedQuestions || []),
        completedDays: Array.from(completedDays || []),
        updatedAt: new Date().toISOString()
      };

      syncRef.set(payload, (error) => {
        if (error) {
          isLocalWrite = false;
          console.error('[FirebaseSync] Error saving to Firebase:', error);
          if (onStatusCallback) onStatusCallback('error', 'Save Failed');
        } else {
          if (onStatusCallback) onStatusCallback('synced', 'Cloud Synced');
        }
      });
    }
  };

  window.FirebaseSync = FirebaseSync;
})();
