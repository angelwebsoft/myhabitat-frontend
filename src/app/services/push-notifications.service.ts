import { Injectable, inject } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { User } from '../models/visitor.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private messaging = inject(Messaging);
  private api = inject(ApiService);

  private initialized = false;

  async initForWeb(user: User) {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (!environment.firebaseVapidKey) {
      console.warn('[Push] Missing environment.firebaseVapidKey; skipping web push init.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const token = await getToken(this.messaging, {
        vapidKey: environment.firebaseVapidKey,
        serviceWorkerRegistration: swReg
      });

      if (token) {
        await this.upsertToken(user, token);
      }

      onMessage(this.messaging, async (payload) => {
        const title = payload?.notification?.title ?? 'Notification';
        const body = payload?.notification?.body ?? '';
        try {
          if (Notification.permission === 'granted') {
            new Notification(title, { body, data: payload?.data });
          }
        } catch (e) {
          // Ignore if browser blocks it; background SW still handles when app not focused.
        }
      });
    } catch (e) {
      console.error('[Push] Web init failed:', e);
    }
  }

  private async upsertToken(user: User, token: string) {
    const key = `gp_fcm_${user.id}`;
    const last = localStorage.getItem(key);
    if (last === token) return;
    localStorage.setItem(key, token);

    try {
      await firstValueFrom(this.api.updateUser(user.id, { fcmToken: token }));
    } catch (e) {
      console.error('[Push] Failed to save fcmToken:', e);
    }
  }
}
