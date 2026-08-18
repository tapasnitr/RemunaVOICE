importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");
firebase.initializeApp({
   apiKey: "AIzaSyC7Cdsl0jrKxIGeOKbdzCQDPLn5NaC1poE",
  authDomain: "remunavoicerkl.firebaseapp.com",
  projectId: "remunavoicerkl",
  messagingSenderId: "225057405832",
  appId: "1:225057405832:web:717b49b134398b9fb3183d",
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png",
  });
});
