import { inject, isDevMode } from '@angular/core';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import {
  getAnalytics, isSupported,
  ScreenTrackingService, UserTrackingService,
} from '@angular/fire/analytics';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import {
  connectFirestoreEmulator, getFirestore, provideFirestore,
} from '@angular/fire/firestore';
import {
  ReCaptchaV3Provider,
  initializeAppCheck,
  provideAppCheck,
  AppCheck
} from "@angular/fire/app-check";
import { SSRSafeService } from "./shared/services/ssr-safe.service";

let firestoreEmulatorStarted = false;

const FirebaseServices = [
  ScreenTrackingService,
  UserTrackingService,
];

export const FirebaseProviders = [
  ...FirebaseServices,
  provideFirebaseApp(() => {
    const app = initializeApp(environment.firebaseConfig);

    /** Google Analytics */
    isSupported().then((supported: boolean) => {
      if (supported) getAnalytics(app);
    });

    return app;
  }),
  provideAuth(() => {
    const auth = getAuth();
    if (isDevMode()) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    return auth;
  }),
  provideAppCheck(() => {
    const ssrSafeService = inject(SSRSafeService);

    if (!ssrSafeService.isBrowser) return new AppCheck({app: getApp()});

    const provider = new ReCaptchaV3Provider(environment.recaptcha3SiteKey);
    return initializeAppCheck(
      getApp(),
      { provider, isTokenAutoRefreshEnabled: true },
    );
  }),
  provideFirestore(() => {
    const firestore = getFirestore();
    if (!firestoreEmulatorStarted) {
      if (isDevMode()) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      firestoreEmulatorStarted = true;
    }
    return firestore;
  }),
];
