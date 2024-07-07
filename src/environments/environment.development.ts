import { FIREBASE_API_KEY, RECAPTCHA3_SITE_KEY } from "./keys";

export const environment = {
  firebaseConfig: {
    apiKey: FIREBASE_API_KEY,
    authDomain: "msu-class-scheduler.firebaseapp.com",
    projectId: "msu-class-scheduler",
    storageBucket: "msu-class-scheduler.appspot.com",
    messagingSenderId: "628815170568",
    appId: "1:628815170568:web:1742d7f5f5b587cb97d5bd",
    measurementId: "G-MGQ5Z4JBNZ"
  },
  recaptcha3SiteKey: RECAPTCHA3_SITE_KEY,
};
