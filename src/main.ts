import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { unregisterServiceWorkers } from './unregister-service-workers';

// The app no longer uses a service worker. This clears the one earlier releases left
// in the browser, and reloads once so the page isn't served from its old cache.
unregisterServiceWorkers()
  .then(hadServiceWorker => hadServiceWorker && location.reload());

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
