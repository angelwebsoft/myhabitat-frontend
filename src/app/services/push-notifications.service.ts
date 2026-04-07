import { Injectable, inject } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { User } from '../models/visitor.model';
import { firstValueFrom } from 'rxjs';
import { Platform } from '@ionic/angular';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private messaging = inject(Messaging);
  private api = inject(ApiService);
  private platform = inject(Platform);
  private notificationService = inject(NotificationService);

  private initialized = false;

  async init(user: User) {
    if (this.initialized) return;
    this.initialized = true;

    if (this.platform.is('hybrid') || this.platform.is('capacitor')) {
      await this.initForNative(user);
    } else {
      await this.initForWeb(user);
    }
  }

  private async initForNative(user: User) {
    this.notificationService.showToast('Push Init Start...', 'info');
    try {
      let permStatus = await PushNotifications.checkPermissions();
      this.notificationService.showToast('Status: ' + permStatus.receive, 'info');

      if (permStatus.receive === 'prompt') {
        this.notificationService.showToast('Requesting Perm...', 'info');
        permStatus = await PushNotifications.requestPermissions();
        this.notificationService.showToast('New Status: ' + permStatus.receive, 'info');
      }

      if (permStatus.receive !== 'granted') {
        // Even if denied, we'll try to add listeners just in case
        this.notificationService.showToast('Push Denied - stopping', 'warning');
      }

      this.notificationService.showToast('Calling Register...', 'info');

      // CREATE CHANNEL FOR ANDROID 8+ (IMPORTANT FOR POPUPS)
      await PushNotifications.createChannel({
        id: 'fcm_default_channel',
        name: 'Gate Pass Alerts',
        description: 'Alerts for resident activities',
        importance: 5,
        visibility: 1,
        vibration: true
      });

      await PushNotifications.register();

      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('[Native Push] Registration token: ', token.value);
        this.notificationService.showToast('FCM Token Registered!', 'success');
        void this.upsertToken(user, token.value);
      });

      // Some issue with our registration and/or callbacks
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('[Native Push] Registration error: ', JSON.stringify(error));
        this.notificationService.showToast('Push Registration Error', 'danger');
      });

      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[Native Push] Notification received: ', notification);
        this.notificationService.showToast('Incoming: ' + (notification.title ?? 'New Event'), 'info');
      });

      // Method called when tapping on a notification
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('[Native Push] Notification action performed: ', notification);
      });

    } catch (e) {
      console.error('[Native Push] initialization failed', e);
    }
  }

  async initForWeb(user: User) {
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
        this.notificationService.showToast(title, 'info');
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
      this.notificationService.showToast('Server Synced!', 'success');
    } catch (e) {
      console.error('[Push] Failed to save fcmToken:', e);
      this.notificationService.showToast('Server Sync Failed', 'danger');
    }
  }
}
