// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWJbn078kC33F5UC3C-kFkcYDnMvyDIcU",
  authDomain: "led-iot-31edf.firebaseapp.com",
  databaseURL:
    "https://led-iot-31edf-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "led-iot-31edf",
  storageBucket: "led-iot-31edf.firebasestorage.app",
  messagingSenderId: "1088683799201",
  appId: "1:1088683799201:web:0c9e3719759e66504676e0",
  measurementId: "G-1EGT1WJTPX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getDatabase(app);
