import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import { MessageService } from 'primeng/api';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

const updatedAppConfig = {
    ...appConfig,
    providers: [
        ...(appConfig.providers || []), // Preserve existing providers from appConfig
        MessageService, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
    ],
};

bootstrapApplication(AppComponent, updatedAppConfig).catch((err) =>
    console.error(err)
);
