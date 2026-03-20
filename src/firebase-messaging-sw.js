/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker (Web only).
// NOTE: This file must be served from the app root: /firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBdItrpqjRrGX7UPDFjzu0uCrmZ961Lwck",
  authDomain: "studio-3531520126-d2a2a.firebaseapp.com",
  projectId: "studio-3531520126-d2a2a",
  storageBucket: "studio-3531520126-d2a2a.firebasestorage.app",
  messagingSenderId: "598528219195",
  appId: "1:598528219195:web:50b051ad20d8633091a41e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Notification";
  const options = {
    body: payload?.notification?.body || "",
    data: payload?.data || {}
  };
  self.registration.showNotification(title, options);
});

