import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { RealtimeService } from '../../../services/realtime.service';
import { PreApprovedGuest, Visitor } from '../../../models/visitor.model';
import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as QRCode from 'qrcode';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { VisitCalendarComponent } from '../../../components/visit-calendar/visit-calendar.component';


@Component({
  selector: 'app-resident-dashboard',
  template: `
    <app-header [title]="headerTitle" color="tertiary"></app-header>

    <ion-content color="light">
      <div class="pb-4 px-4 rounded-b-[28px] bg-[var(--ion-color-tertiary)] text-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <h1 class="m-0 text-[1.55rem] font-extrabold">Visitor Requests</h1>
        <!-- <p class="mt-1 text-[1rem] font-semibold text-white">{{ residentName }}</p> -->
        <p class="mt-1 text-[13px] opacity-80">You have {{ pendingCount }} pending requests</p>
      </div>

      <div class="px-3 pt-3">
        <visit-calendar
          [visitors]="(visitors$ | async) ?? []"
          title="Visits Calendar"
          subtitle="Your visitors (date-wise)"
          [showList]="false"
          [selectedDate]="selectedDate"
          (selectedDateChange)="onSelectedDateChange($event)"
        ></visit-calendar>
      </div>

      <div class="animate__animated animate__fadeIn px-3 pt-3">
        <ion-card class="mb-3 rounded-[18px] border border-black/[0.02] shadow-[0_8px_20px_rgba(0,0,0,0.06)]" *ngFor="let visitor of visitorsForSelectedDate$ | async">
          <div class="flex items-center gap-3 p-4">
            <ion-avatar class="h-[52px] w-[52px] border-2 border-[var(--ion-color-tertiary-light,#f0f0f0)]">
              <img class="h-full" [src]="visitor.photoURL || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
            </ion-avatar>
            <div class="min-w-0">
              <ion-badge [color]="getStatusColor(visitor.status)" class="mb-1.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.65rem] tracking-[0.5px]">
                <div class="dot" *ngIf="visitor.status === 'pending'"></div>{{ getStatusLabel(visitor.status) }}
              </ion-badge>
              <h2 class="m-0 truncate text-[15px] font-bold text-slate-800">{{ visitor.visitorName }}</h2>
              <p class="m-0.5 truncate text-[13px] text-slate-500">{{ visitor.purpose }}</p>
            </div>
          </div>
          
          <ion-card-content>
            <div class="mb-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:gap-5">
              <div class="flex items-center gap-1.5 text-[13px] text-slate-500">
                <ion-icon name="time-outline"></ion-icon>
                <span>{{ visitor.createdAt | date:'shortTime' }}</span>
              </div>
              <div class="flex items-center gap-1.5 text-[13px] text-slate-500">
                <ion-icon name="call-outline"></ion-icon>
                <span>{{ visitor.mobile }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5" *ngIf="visitor.status === 'pending'">
              <ion-button color="danger" fill="clear" (click)="onAction(visitor.id, 'rejected')" class="m-0 h-11 text-[13px] font-bold [--border-radius:12px]">
                <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                Decline
              </ion-button>
              <ion-button color="success" (click)="onAction(visitor.id, 'approved')" class="m-0 h-11 text-[13px] font-bold [--border-radius:12px] [--box-shadow:0_4px_12px_rgba(var(--ion-color-success-rgb),0.3)]">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                Authorize
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <div class="px-3 pb-3" *ngIf="preApprovedForSelectedDate.length">
        <h2 class="mb-2 mt-2 text-[14px] font-extrabold text-slate-800">Pre-Approved Guests</h2>
        <ion-card class="mb-3 rounded-[18px] border border-black/[0.02] shadow-[0_8px_20px_rgba(0,0,0,0.06)]" *ngFor="let g of preApprovedForSelectedDate">
          <ion-card-content>
            <div class="flex items-start justify-between gap-3">
              <button type="button" class="shrink-0 rounded-xl border border-slate-200 bg-white p-2" (click)="openPreQr(g)">
                <img *ngIf="preQrById[g.id]" [src]="preQrById[g.id]" alt="QR" class="h-[74px] w-[74px]" />
                <div *ngIf="!preQrById[g.id]" class="flex h-[74px] w-[74px] items-center justify-center text-[12px] text-slate-400">QR</div>
              </button>

              <div class="min-w-0 flex-1">
                <h3 class="m-0 truncate text-[15px] font-bold text-slate-800">{{ g.visitorName }}</h3>
                <p class="mt-1 truncate text-[13px] text-slate-500">{{ g.mobile }} • {{ g.validDate | date:'mediumDate' }}</p>
                <p class="mt-1 truncate text-[12px] text-slate-400">Token: {{ g.qrToken || '-' }}</p>
              </div>
              <ion-badge [color]="getPreApprovedColor(g)" class="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold">
                {{ getPreApprovedLabel(g) }}
              </ion-badge>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <ion-modal [isOpen]="isPreQrModalOpen" (didDismiss)="closePreQr()">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="tertiary">
              <ion-title>Guest QR</ion-title>
              <ion-buttons slot="end">
                <ion-button fill="clear" size="small" aria-label="Close" (click)="closePreQr()">
                  <ion-icon name="close" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding" color="light">
            <div class="rounded-2xl bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]" *ngIf="preQrModalGuest">
              <p class="m-0 text-[14px] font-bold text-slate-800">{{ preQrModalGuest.visitorName }}</p>
              <p class="mt-1 text-[13px] text-slate-500">{{ preQrModalGuest.mobile }} • {{ preQrModalGuest.validDate | date:'mediumDate' }}</p>
              <div class="mt-4 flex items-center justify-center">
                <img *ngIf="preQrById[preQrModalGuest.id]" [src]="preQrById[preQrModalGuest.id]" alt="Guest QR Large" class="h-[320px] w-[320px] rounded-2xl border border-slate-200 bg-white p-3" />
              </div>
              <ion-item lines="none" class="mt-4 [--background:#f4f5f8] [--border-radius:12px]">
                <ion-label class="text-[12px] text-slate-500">Token</ion-label>
                <ion-note slot="end" class="select-all text-[12px]">{{ preQrModalGuest.qrToken || '-' }}</ion-note>
              </ion-item>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

      <div *ngIf="(visitorsForSelectedDate$ | async)?.length === 0" class="flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-green-50">
          <ion-icon name="shield-checkmark-outline"></ion-icon>
        </div>
        <h2 class="mb-2 font-extrabold text-slate-800">All Clear!</h2>
        <p class="text-[14px] leading-6 text-slate-500">No visitor requests found for your flat.</p>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button color="tertiary" (click)="onPreApprove()" class="fab-main">
          <ion-icon name="person-add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .dot {
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      animation: blink 1s infinite;
    }
    @keyframes blink {
      0% { opacity: 1; }
      50% { opacity: 0.3; }
      100% { opacity: 1; }
    }
    .detail-item ion-icon {
      font-size: 18px;
      color: var(--ion-color-tertiary);
    }
    .empty-icon-wrapper ion-icon {
      font-size: 50px;
      color: #22c55e;
    }
    .fab-main {
      --box-shadow: 0 8px 16px rgba(var(--ion-color-tertiary-rgb), 0.4);
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, VisitCalendarComponent]
})
export class ResidentDashboardPage implements OnInit {
  visitors$: Observable<Visitor[]> = of([]);
  visitorsForSelectedDate$: Observable<Visitor[]> = of([]);
  preApproved: PreApprovedGuest[] = [];
  preApprovedForSelectedDate: PreApprovedGuest[] = [];
  preQrById: Record<string, SafeUrl> = {};
  isPreQrModalOpen = false;
  preQrModalGuest: PreApprovedGuest | null = null;
  residentName: string = '';
  headerTitle: string = 'Resident Portal';
  pendingCount = 0;
  selectedDate = this.toLocalIsoDate(new Date());
  private selectedDate$ = new BehaviorSubject<string>(this.selectedDate);
  private currentSocietyId = '';
  private currentResidentId = '';
  private authSubscription?: Subscription;
  private visitorsSubscription?: Subscription;
  private stopPreApprovedCreatedListener?: () => void;
  private stopPreApprovedUsedListener?: () => void;

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private realtimeService = inject(RealtimeService);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);


  async ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe(async user => {
      if (user && user.role === 'resident') {
        this.residentName = user.flatNumber
          ? `${user.userName} • Flat ${user.flatNumber}`
          : user.userName;
        this.headerTitle = 'Resident Dashboard';
        this.currentSocietyId = user.societyId;
        this.currentResidentId = user.id;
        try {
          const visitorsStream = await this.dataService.getVisitorsBySociety(user.societyId, user.id);
          this.visitors$ = visitorsStream.pipe(
            map(list => [...list].sort((a, b) => this.getStatusPriority(a.status) - this.getStatusPriority(b.status)))
          );
          this.visitorsForSelectedDate$ = combineLatest([this.visitors$, this.selectedDate$]).pipe(
            map(([list, selectedDate]) =>
              [...list]
                .filter((v) => this.toLocalIsoDate(this.getVisitorDate(v)) === selectedDate)
                .sort((a, b) => this.getVisitorDate(b).getTime() - this.getVisitorDate(a).getTime())
            )
          );
          this.visitorsSubscription?.unsubscribe();
          this.visitorsSubscription = this.visitors$.subscribe(list => {
            this.pendingCount = list.filter(visitor => visitor.status === 'pending').length;
          });
          this.bindPreApprovedRealtime();
          await this.refreshPreApproved();
        } catch (e) {
          console.error('Failed to load visitors', e);
          this.visitors$ = of([]);
          this.pendingCount = 0;
        }
      } else {
        this.visitors$ = of([]);
        this.pendingCount = 0;
        this.preApproved = [];
        this.preApprovedForSelectedDate = [];
        this.unbindPreApprovedRealtime();
      }
    });
  }

  ionViewWillEnter() {
    if (this.currentSocietyId) {
      this.dataService.refreshVisitorsForSociety(this.currentSocietyId).catch(error => {
        console.error('Failed to refresh resident visitors on enter', error);
      });
      this.refreshPreApproved().catch(error => {
        console.error('Failed to refresh pre-approved guests on enter', error);
      });
    }
  }

  ngOnDestroy() {
    this.unbindPreApprovedRealtime();
    this.authSubscription?.unsubscribe();
    this.visitorsSubscription?.unsubscribe();
  }

  async onAction(visitorId: string, status: 'approved' | 'rejected') {
    try {
      await this.dataService.updateVisitorStatus(visitorId, status);
      const toast = await this.toastCtrl.create({
        message: `Visitor ${status}`,
        duration: 2000,
        color: status === 'approved' ? 'success' : 'danger'
      });
      toast.present();
    } catch (e) {
      console.error(e);
    }
  }

  onPreApprove() {
    this.router.navigate(['/resident/pre-approve']);
  }


  onLogout() {
    this.authService.logout();
  }

  onSelectedDateChange(isoDate: string) {
    this.selectedDate = isoDate;
    this.selectedDate$.next(isoDate);
    this.updatePreApprovedForSelectedDate();
  }

  private getVisitorDate(v: Visitor): Date {
    const raw = (v.checkInTime ?? v.createdAt) as any;
    const d = raw instanceof Date ? raw : new Date(raw);
    return Number.isFinite(d.getTime()) ? d : new Date();
  }

  private toLocalIsoDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getStatusColor(status: Visitor['status']) {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'checked-in':
        return 'primary';
      case 'checked-out':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: Visitor['status']) {
    switch (status) {
      case 'checked-in':
        return 'Inside';
      case 'checked-out':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  private getStatusPriority(status: Visitor['status']) {
    switch (status) {
      case 'pending':
        return 0;
      case 'approved':
        return 1;
      case 'checked-in':
        return 2;
      case 'rejected':
        return 3;
      case 'checked-out':
        return 4;
      default:
        return 5;
    }
  }

  private bindPreApprovedRealtime() {
    if (this.stopPreApprovedCreatedListener || this.stopPreApprovedUsedListener) return;

    // NOTE: Avoid `interval(3000)` polling.
    // Visitors are already pushed via socket.io into `DataService`.
    // Pre-approved guests are refreshed only when a relevant realtime event arrives.
    this.stopPreApprovedCreatedListener = this.realtimeService.onPreApprovedCreated((guest) => {
      if (!guest) return;
      if (guest.societyId !== this.currentSocietyId) return;
      if (guest.residentId !== this.currentResidentId) return;
      this.refreshPreApproved().catch(error => {
        console.error('Failed to refresh pre-approved guests (created)', error);
      });
    });

    this.stopPreApprovedUsedListener = this.realtimeService.onPreApprovedUsed((guest) => {
      if (!guest) return;
      if (guest.societyId !== this.currentSocietyId) return;
      if (guest.residentId !== this.currentResidentId) return;
      this.refreshPreApproved().catch(error => {
        console.error('Failed to refresh pre-approved guests (used)', error);
      });
    });
  }

  private unbindPreApprovedRealtime() {
    this.stopPreApprovedCreatedListener?.();
    this.stopPreApprovedUsedListener?.();
    this.stopPreApprovedCreatedListener = undefined;
    this.stopPreApprovedUsedListener = undefined;
  }

  private async refreshPreApproved() {
    if (!this.currentSocietyId || !this.currentResidentId) return;
    const list = await this.dataService.listPreApprovedForResident(this.currentSocietyId, this.currentResidentId);
    this.preApproved = Array.isArray(list) ? list : [];
    this.autoSelectUpcomingPreApprovedDate();
    this.updatePreApprovedForSelectedDate();
    await this.ensurePreApprovedQr();
  }

  private updatePreApprovedForSelectedDate() {
    const selected = this.selectedDate;
    this.preApprovedForSelectedDate = (this.preApproved ?? [])
      .filter((g) => this.toLocalIsoDate(new Date(g.validDate as any)) === selected)
      .sort((a, b) => new Date(a.validDate as any).getTime() - new Date(b.validDate as any).getTime());
  }

  private autoSelectUpcomingPreApprovedDate() {
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const upcoming = (this.preApproved ?? [])
      .filter((g) => g.status !== 'used')
      .map((g) => ({ g, t: new Date(g.validDate as any).getTime() }))
      .filter((x) => Number.isFinite(x.t) && x.t >= startToday)
      .sort((a, b) => a.t - b.t)[0]?.g;

    if (!upcoming) return;

    const iso = this.toLocalIsoDate(new Date(upcoming.validDate as any));
    this.selectedDate = iso;
    this.selectedDate$.next(iso);
  }

  private async ensurePreApprovedQr() {
    for (const g of this.preApproved) {
      if (!g?.id || this.preQrById[g.id] || !g.qrToken) continue;
      try {
        const dataUrl = await QRCode.toDataURL(g.qrToken, { width: 220, margin: 1 });
        this.preQrById[g.id] = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
      } catch {
        // If QR generation fails, keep token text only.
      }
    }
  }

  openPreQr(g: PreApprovedGuest) {
    if (!g) return;
    this.preQrModalGuest = g;
    this.isPreQrModalOpen = true;
  }

  closePreQr() {
    this.isPreQrModalOpen = false;
    this.preQrModalGuest = null;
  }

  getPreApprovedLabel(g: PreApprovedGuest) {
    if (g.status === 'used') return 'Used';
    const valid = new Date(g.validDate);
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startValid = new Date(valid.getFullYear(), valid.getMonth(), valid.getDate());
    if (startValid.getTime() < startToday.getTime()) return 'Expired';
    return 'Pending';
  }

  getPreApprovedColor(g: PreApprovedGuest) {
    const label = this.getPreApprovedLabel(g);
    if (label === 'Used') return 'medium';
    if (label === 'Expired') return 'danger';
    return 'success';
  }
}
