import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Visitor } from '../../../models/visitor.model';
import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { VisitCalendarComponent } from '../../../components/visit-calendar/visit-calendar.component';

@Component({
  selector: 'app-gatekeeper-dashboard',
  template: `
    <app-header title="Gatekeeper Dashboard" color="warning" titleColor="dark"></app-header>

    <ion-content color="light">
      <div class="rounded-b-[32px] bg-white px-4 pb-5 pt-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]" *ngIf="currentUser$ | async as user">
        <!-- Top row: Avatar + Name and Action Capsule -->
        <div class="flex items-center justify-between gap-2">
          <!-- Profile Left -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="h-11 w-11 shrink-0 overflow-hidden rounded-[14px] border-2 border-[var(--ion-color-warning)] p-0.5">
              <img class="h-full w-full rounded-[12px] object-cover" [src]="'https://ionicframework.com/docs/img/demos/avatar.svg'" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-[14px] font-extrabold text-slate-900 leading-tight">{{ user.userName }}</h2>
              <p class="text-[11px] font-medium text-slate-400">GateKeeper</p>
            </div>
          </div>

          <!-- Action Capsule Right -->
          <div class="flex items-center h-8.5 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_4px_10px_rgba(var(--ion-color-warning-rgb),0.25)]">
            <button (click)="onNewEntry()" class="flex h-full items-center gap-0.5 px-2.5 py-2 text-[11px] font-extrabold text-white transition-opacity active:opacity-75">
              <ion-icon name="add" class="text-base"></ion-icon>
              New
            </button>
            <div class="h-3.5 w-[1px] bg-white/30"></div>
            <button (click)="onScanQr()" class="flex h-full items-center gap-1 px-2.5 py-2 text-[11px] font-extrabold text-white transition-opacity active:opacity-75">
              <ion-icon name="qr-code-outline" class="text-[14px]"></ion-icon>
              Scan
            </button>
          </div>
        </div>

        <!-- Greeting Middle -->
        <div class="mt-5">
          <h1 class="text-[20px] font-extrabold text-slate-800">Welcome, {{ user.userName.split(' ')[0] }}</h1>
        </div>

        <!-- Search input Bottom -->
        <div class="mt-4 relative flex items-center h-11 rounded-full bg-slate-100 px-4 text-slate-400">
          <ion-icon name="search" class="text-lg mr-2 text-slate-400"></ion-icon>
          <input 
            type="text" 
            placeholder="Search requests..." 
            (input)="onSearchChange($event)"
            class="w-full bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400" 
          />
        </div>
      </div>

      <div class="px-3 pb-5 pt-3">
        <visit-calendar
          [visitors]="(visitors$ | async) ?? []"
          title="Visits Calendar"
          subtitle="Your created requests (date-wise)"
          [showList]="false"
          [selectedDate]="selectedDate"
          (selectedDateChange)="onSelectedDateChange($event)"
        ></visit-calendar>

        <div class="pt-3">
        <div *ngFor="let visitor of visitorsForSelectedDate$ | async" class="mb-3 overflow-hidden rounded-[18px] shadow-[0_6px_18px_rgba(15,23,42,0.06)] bg-white">
          <div class="p-3.5">
            <div class="flex items-start gap-3">
              <ion-avatar class="h-11 w-11 shrink-0">
                <img class="h-full" [src]="visitor.photoURL || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
              </ion-avatar>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h2 class="truncate text-[15px] font-semibold text-slate-800">{{ visitor.visitorName }}</h2>
                    <p class="truncate text-[13px] text-slate-500">Flat {{ visitor.flatNumber }}<span *ngIf="visitor.purpose"> • {{ visitor.purpose }}</span></p>
                    <p class="mt-1 truncate text-[12px] text-slate-400">{{ visitor.createdAt | date:'short' }}</p>
                  </div>
                  <ion-badge [color]="getStatusColor(visitor.status)" class="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold">
                    {{ getStatusLabel(visitor.status) }}
                  </ion-badge>
                </div>
              </div>
            </div>

            <div class="mt-3" *ngIf="visitor.status === 'approved'">
              <ion-button expand="block" color="success" class="h-10 text-[13px] font-semibold [--border-radius:12px]" (click)="onCheckIn(visitor.id)">
                Check In
              </ion-button>
            </div>

            <div class="mt-3" *ngIf="visitor.status === 'checked-in'">
              <ion-button expand="block" color="danger" class="h-10 text-[13px] font-semibold [--border-radius:12px]" (click)="onCheckOut(visitor.id)">
                Check Out
              </ion-button>
            </div>
          </div>
        </div>
        </div>

        <div *ngIf="(visitorsForSelectedDate$ | async)?.length === 0" class="px-5 py-10 text-center text-slate-400">
          <ion-icon name="document-text-outline" class="mb-2 text-5xl opacity-30"></ion-icon>
          <p>No visitor requests yet</p>
        </div>

        <!-- Safe Area Spacer to keep items from bleeding behind floating actions/bottom keys -->
        <div [style.height]="'calc(env(safe-area-inset-bottom, 0px) + 80px)'"></div>
      </div>
    </ion-content>

    <!-- Native Fixed Floating Action Button (Replaces ion-fab) -->
    <button (click)="onNewEntry()" [style.bottom]="'calc(env(safe-area-inset-bottom, 0px) + 24px)'" class="fixed right-5 z-[99] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[var(--ion-color-warning)] shadow-[0_6px_16px_rgba(var(--ion-color-warning-rgb),0.4)] transition-transform active:scale-95 sm:bottom-8 sm:right-8">
      <ion-icon name="add" class="text-[32px] text-white"></ion-icon>
    </button>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, VisitCalendarComponent]
})
export class GatekeeperDashboardPage implements OnInit {
  visitors$: Observable<Visitor[]> = of([]);
  visitorsForSelectedDate$: Observable<Visitor[]> = of([]);
  gatekeeperName = 'Society Gate Management';
  private authSubscription?: Subscription;
  private currentSocietyId = '';
  private currentGatekeeperId = '';
  selectedDate = this.toLocalIsoDate(new Date());
  private selectedDate$ = new BehaviorSubject<string>(this.selectedDate);
  private searchTerm$ = new BehaviorSubject<string>('');

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;

  async ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe(async user => {
      if (!user) {
        this.visitors$ = of([]);
        return;
      }

      this.gatekeeperName = user.flatNumber
        ? `${user.userName} • Flat ${user.flatNumber}`
        : user.userName;
      this.currentSocietyId = user.societyId;
      this.currentGatekeeperId = user.id;

      const visitorsStream = await this.dataService.getVisitorsBySociety(user.societyId, undefined, user.id);
      this.visitors$ = visitorsStream.pipe(
        map(list => [...list].sort((a, b) => this.getStatusPriority(a.status) - this.getStatusPriority(b.status)))
      );

      this.visitorsForSelectedDate$ = combineLatest([this.visitors$, this.selectedDate$, this.searchTerm$]).pipe(
        map(([list, selectedDate, searchTerm]) =>
          [...list]
            .filter((v) => this.toLocalIsoDate(this.getVisitorDate(v)) === selectedDate)
            .filter((v) => !searchTerm || v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) || v.mobile?.includes(searchTerm))
            .sort((a, b) => this.getVisitorDate(b).getTime() - this.getVisitorDate(a).getTime())
        )
      );
    });
  }

  onSearchChange(ev: any) {
    const term = ev?.target?.value || '';
    this.searchTerm$.next(term);
  }

  ionViewWillEnter() {
    if (this.currentSocietyId && this.currentGatekeeperId) {
      this.dataService.refreshVisitorsForSociety(this.currentSocietyId).catch(error => {
        console.error('Failed to refresh gatekeeper visitors on enter', error);
      });
    }
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  async onCheckIn(visitorId: string) {
    try {
      await this.dataService.updateVisitorStatus(visitorId, 'checked-in', {
        checkInTime: new Date()
      });
    } catch (e) {
      console.error(e);
    }
  }

  async onCheckOut(visitorId: string) {
    try {
      await this.dataService.updateVisitorStatus(visitorId, 'checked-out', {
        checkOutTime: new Date()
      });
    } catch (e) {
      console.error(e);
    }
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
      case 'rejected':
        return 2;
      case 'checked-in':
        return 3;
      case 'checked-out':
        return 4;
      default:
        return 5;
    }
  }

  onNewEntry() {
    this.router.navigate(['/gatekeeper/new']);
  }

  onScanQr() {
    this.router.navigate(['/gatekeeper/scan']);
  }

  onLogout() {
    this.authService.logout();
  }

  onSelectedDateChange(isoDate: string) {
    this.selectedDate = isoDate;
    this.selectedDate$.next(isoDate);
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

  // NOTE: We intentionally avoid `interval(3000)` polling here.
  // `DataService` keeps the visitor list up to date via socket.io realtime events
  // and emits changes through `getVisitorsBySociety(...)`.
}
