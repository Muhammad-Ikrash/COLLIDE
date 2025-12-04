import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Use hash location strategy for Electron file:// protocol compatibility
const isElectron = window.location.protocol === 'file:' || 
                   (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron'));

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Use hash location for file:// protocol (Electron built mode)
    isElectron ? provideRouter(routes, withHashLocation()) : provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
