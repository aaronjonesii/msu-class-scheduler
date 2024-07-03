import { FIREBASE_API_KEY, RECAPTCHA3_SITE_KEY } from "./keys";

export const environment = {
  firebaseConfig: {
    apiKey: FIREBASE_API_KEY,
    authDomain: "classes-schedule-builder.firebaseapp.com",
    projectId: "classes-schedule-builder",
    storageBucket: "classes-schedule-builder.appspot.com",
    messagingSenderId: "892879269762",
    appId: "1:892879269762:web:7eff7611222ee8f7e4e99b",
    measurementId: "G-0K6TZ0NDM2"
  },
  recaptcha3SiteKey: RECAPTCHA3_SITE_KEY,
};
