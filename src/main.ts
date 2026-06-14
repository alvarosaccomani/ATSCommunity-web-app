import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    if ('serviceWorker' in navigator) {
      if (environment.production) {
        navigator.serviceWorker.register('/service-worker.js')
          .then((reg) => console.log('Service Worker registrado con alcance:', reg.scope))
          .catch((err) => console.error('Error al registrar el Service Worker:', err));
      } else {
        console.log('Service Worker omitido en modo desarrollo local.');
      }
    }
  })
  .catch((err) => console.error(err));
