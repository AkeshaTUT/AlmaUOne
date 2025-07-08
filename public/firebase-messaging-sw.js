importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA-S2x5ImudnsHyf-y4LsfM0TiPAT95ByM",
  authDomain: "almauone-d340b.firebaseapp.com",
  projectId: "almauone-d340b",
  storageBucket: "almauone-d340b.appspot.com",
  messagingSenderId: "764139271255",
  appId: "1:764139271255:web:b8553cfcff61e8c10adf12",
  measurementId: "G-D9KBERGPQT"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: '/favicon.ico'
    }
  );
}); 