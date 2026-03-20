import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { PreApprovedGuest, Visitor } from '../models/visitor.model';

type ServerToClientEvents = {
  'visitor:created': (visitor: Visitor) => void;
  'visitor:updated': (visitor: Visitor) => void;
  'preapproved:created': (guest: PreApprovedGuest) => void;
  'preapproved:used': (guest: PreApprovedGuest) => void;
};

type ClientToServerEvents = {
  'society:join': (societyId: string) => void;
};

const getSocketBaseUrl = () => environment.apiUrl.replace(/\/api\/?$/, '');

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private socket?: Socket<ServerToClientEvents, ClientToServerEvents>;
  private currentSocietyId?: string;
  private connectedSubject = new BehaviorSubject<boolean>(false);

  connected$: Observable<boolean> = this.connectedSubject.asObservable();

  connect(societyId: string) {
    if (!societyId) return;

    if (this.socket?.connected && this.currentSocietyId === societyId) return;

    if (!this.socket) {
      this.currentSocietyId = societyId;
      this.socket = io(getSocketBaseUrl(), {
        transports: ['websocket', 'polling'],
        query: { societyId }
      });

      this.socket.on('connect', () => {
        this.connectedSubject.next(true);
        if (this.currentSocietyId) {
          this.socket?.emit('society:join', this.currentSocietyId);
        }
      });
      this.socket.on('disconnect', () => this.connectedSubject.next(false));
      this.socket.on('connect_error', () => this.connectedSubject.next(false));
    } else {
      this.currentSocietyId = societyId;
      this.socket.io.opts.query = { societyId };
      // Ensure server gets the updated query/room join.
      if (this.socket.connected) this.socket.disconnect();
      this.socket.connect();
    }

    if (this.socket?.connected) {
      this.socket.emit('society:join', societyId);
    }
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.connectedSubject.next(false);
  }

  onVisitorCreated(handler: (visitor: Visitor) => void) {
    this.socket?.on('visitor:created', handler);
    return () => this.socket?.off('visitor:created', handler);
  }

  onVisitorUpdated(handler: (visitor: Visitor) => void) {
    this.socket?.on('visitor:updated', handler);
    return () => this.socket?.off('visitor:updated', handler);
  }

  onPreApprovedCreated(handler: (guest: PreApprovedGuest) => void) {
    this.socket?.on('preapproved:created', handler);
    return () => this.socket?.off('preapproved:created', handler);
  }

  onPreApprovedUsed(handler: (guest: PreApprovedGuest) => void) {
    this.socket?.on('preapproved:used', handler);
    return () => this.socket?.off('preapproved:used', handler);
  }
}
