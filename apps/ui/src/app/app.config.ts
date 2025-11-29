import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

const firebaseConfig = {
  projectId: 'ng-lens',
  appId: '1:899848444233:web:e31a2c329136f430d52298',
  storageBucket: 'ng-lens.firebasestorage.app',
  apiKey: 'AIzaSyDCsxnp8-_YGyU3V5hcmUrZsJV3l4os4m0',
  authDomain: 'ng-lens.firebaseapp.com',
  messagingSenderId: '899848444233',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFunctions(() => getFunctions()),
  ],
};
