import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: 'visitor_request' | 'system';
    createdAt: Date;
    isRead: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications: AppNotification[] = [];
    private notifications$ = new BehaviorSubject<AppNotification[]>([]);
    private authService = inject(AuthService);

    constructor() {
        this.loadFromStorage();
        this.initCrossTabListener();
    }

    private loadFromStorage() {
        const data = localStorage.getItem('gp_notifications');
        if (data) {
            try {
                this.notifications = JSON.parse(data);
                this.notifications$.next([...this.notifications]);
            } catch (e) {
                this.notifications = [];
            }
        }
    }

    private initCrossTabListener() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'gp_visitors' && event.newValue) {
                try {
                    const visitors = JSON.parse(event.newValue);
                    const currentUser = this.authService.currentUser$.value;

                    if (currentUser && currentUser.role === 'resident') {
                        // Check if there's a new pending visitor for this resident
                        const myPending = visitors.filter((v: any) =>
                            v.residentId === currentUser.id && v.status === 'pending'
                        );

                        if (myPending.length > 0) {
                            const latest = myPending[myPending.length - 1];
                            const notifiedKey = `notified_${latest.id}`;

                            // Prevent multiple notifications for the same visitor object
                            if (!sessionStorage.getItem(notifiedKey)) {
                                this.notify(currentUser.id, 'New Visitor', `${latest.visitorName} is at the gate.`, 'visitor_request');
                                sessionStorage.setItem(notifiedKey, 'true');
                            }
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse storage update', e);
                }
            }
        });
    }

    private saveToStorage() {
        localStorage.setItem('gp_notifications', JSON.stringify(this.notifications));
        this.notifications$.next([...this.notifications]);
    }

    getNotifications(userId: string) {
        return this.notifications$.asObservable();
    }

    async notify(userId: string, title: string, body: string, type: AppNotification['type'] = 'visitor_request') {
        const currentUser = this.authService.currentUser$.value;

        // CRITICAL: Only show the toast/notification if it's for the currently logged-in resident
        if (currentUser && currentUser.id === userId) {
            const notification: AppNotification = {
                id: `ntf_${Date.now()}`,
                userId,
                title,
                body,
                type,
                createdAt: new Date(),
                isRead: false
            };

            this.notifications.unshift(notification);
            this.saveToStorage();

            // Web: prefer OS-level notification instead of in-app toast.
            try {
                if (typeof window !== 'undefined' && 'Notification' in window) {
                    if (Notification.permission === 'granted') {
                        new Notification(title, { body });
                    }
                }
            } catch (e) {
                // Ignore notification errors; storage still keeps the message.
            }
        }
    }

    markAsRead(notificationId: string) {
        const n = this.notifications.find(item => item.id === notificationId);
        if (n) {
            n.isRead = true;
            this.saveToStorage();
        }
    }
}
