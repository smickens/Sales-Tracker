// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    // got properties from firebase web app config
    apiKey: "AIzaSyB2m_1aKV-GQ3cq99RnY0BaG-ASNBpD_yA",
    authDomain: "state-farm-app-tracker.firebaseapp.com",
    databaseURL: "https://state-farm-app-tracker.firebaseio.com",
    projectId: "state-farm-app-tracker",
    storageBucket: "state-farm-app-tracker.appspot.com",
    messagingSenderId: "551436189832",
    appId: "1:551436189832:web:e4ab0512a1ea87e8a19f3d"
  },
  logged_in: false
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
