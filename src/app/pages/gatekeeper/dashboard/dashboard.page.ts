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
import { FormsModule } from '@angular/forms';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { CommonButtonComponent } from 'src/app/components/common-button/common-button.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';

@Component({
  selector: 'app-gatekeeper-dashboard',
  template: `
    <ion-header class="ion-no-border">
      <app-header title="Gatekeeper Dashboard" color="primary" titleColor="dark"></app-header>
    </ion-header>

    <ion-content >
    <div style="background: var(--ion-color-primary-light);">
      <div class="rounded-b-[32px] bg-white px-4 pb-5 pt-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]" *ngIf="currentUser$ | async as user">
        <!-- Top row: Avatar + Name and Action Capsule -->
        <div class="flex items-center justify-between gap-2">
          <!-- Profile Left -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="h-11 w-11 shrink-0 overflow-hidden rounded-[14px] border-2 border-[var(--ion-color-warning)] p-0.5">
              <img class="h-full w-full rounded-[12px] object-cover" [src]="'https://ionicframework.com/docs/img/demos/avatar.svg'" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-[14px] font-extrabold text-slate-900 leading-tight m-0">{{ user.userName }}</h2>
              <p class="text-[11px] font-medium text-slate-400 m-0">GateKeeper</p>
            </div>
          </div>

          <!-- Action Capsule Right -->
         
          <app-common-button
            label=""
            fill="solid"
            icon="qr-code-outline"
            (btnClick)="onScanQr()"
            size="small"
            customClass="font-extrabold flex items-center justify-center gap-0 rounded-full"
            color="primary"
          ></app-common-button>  
        
        </div>

        <!-- Greeting Middle -->
        <div class="mt-5">
          <h1 class="text-[20px] font-extrabold text-slate-800">Welcome, {{ user.userName.split(' ')[0] }}</h1>
        </div>

        <!-- Search input Bottom -->
        <div class="mt-4">
          <app-common-input 
            placeholder="Search requests..." 
            iconName="search"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange($event)"
          ></app-common-input>
        </div>
      </div>

      <div class="px-3 pt-3" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 108px);">
        <visit-calendar
          [visitors]="(visitors$ | async) ?? []"
          title="Visits Calendar"
          subtitle="Your created requests (date-wise)"
          [showList]="false"
          [selectedDate]="selectedDate"
          (selectedDateChange)="onSelectedDateChange($event)"
          (tabChange)="onTabChange($event)"
        ></visit-calendar>

        <div class="space-y-4 pt-3">
          <div *ngFor="let visitor of visitorsForSelectedDate$ | async" class="animate__animated animate__fadeInUp">
            <app-common-card customClass="m-0" [color]="getStatusColor(visitor.status)">
              <div slot="header-end" class="rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1.5" [ngClass]="{
                'bg-yellow-100 text-yellow-600': visitor.status === 'pending',
                'bg-green-100 text-green-600': visitor.status === 'approved',
                'bg-blue-100 text-blue-600': visitor.status === 'checked-in',
                'bg-red-100 text-red-600': visitor.status === 'rejected',
                'bg-gray-100 text-gray-600': visitor.status === 'checked-out'
              }">
                <div class="h-1.5 w-1.5 rounded-full" [ngClass]="{
                  'bg-yellow-500': visitor.status === 'pending',
                  'bg-green-500': visitor.status === 'approved',
                  'bg-blue-500': visitor.status === 'checked-in',
                  'bg-red-500': visitor.status === 'rejected',
                  'bg-gray-500': visitor.status === 'checked-out'
                }"></div>
                {{ getStatusLabel(visitor.status) }}
              </div>

              <div class="flex items-center gap-4 mb-4">
                <ion-avatar class="h-[52px] w-[52px] shrink-0 bg-slate-100 rounded-[16px]">
                  <img class="h-full rounded-[16px]" [src]="visitor.photoURL || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                </ion-avatar>
                <div class="min-w-0">
                  <h2 class="m-0 truncate text-[17px] font-bold text-slate-800">{{ visitor.visitorName }}</h2>
                  <p class="mt-0.5 text-[13px] font-medium text-slate-400">Flat {{ visitor.flatNumber }}<span *ngIf="visitor.purpose"> • {{ visitor.purpose }}</span></p>
                </div>
              </div>

              <div class="flex items-center gap-6 text-[13px] text-slate-500 font-medium">
                <div class="flex items-center gap-2">
                  <ion-icon name="time-outline" class="text-slate-400 text-lg"></ion-icon>
                  {{ visitor.createdAt | date:'shortTime' }}
                </div>
                <div class="flex items-center gap-2" *ngIf="visitor.mobile">
                  <ion-icon name="call-outline" class="text-slate-400 text-lg"></ion-icon>
                  {{ visitor.mobile }}
                </div>
              </div>

              <div slot="footer" class="w-full mt-4" *ngIf="visitor.status === 'approved' || visitor.status === 'checked-in'">
                <button *ngIf="visitor.status === 'approved'" 
                  class="w-full flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-bold text-white bg-green-500 rounded-2xl shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all" 
                  (click)="onCheckIn(visitor.id)">
                  <ion-icon name="checkmark-circle-outline" class="text-xl"></ion-icon>
                  CHECK IN VISITOR
                </button>

                <button *ngIf="visitor.status === 'checked-in'" 
                  class="w-full flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-bold text-white bg-red-500 rounded-2xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all" 
                  (click)="onCheckOut(visitor.id)">
                  <ion-icon name="log-out-outline" class="text-xl"></ion-icon>
                  CHECK OUT VISITOR
                </button>
              </div>
            </app-common-card>
          </div>
        </div>

        <div *ngIf="(visitorsForSelectedDate$ | async)?.length === 0" class="px-5 py-10 text-center text-slate-400">
          <ion-icon name="document-text-outline" class="mb-2 text-5xl opacity-30"></ion-icon>
          <p>No visitor requests yet</p>
        </div>

        <!-- Safe Area Spacer to keep items from bleeding behind floating actions/bottom keys -->
      </div>
    </div>
    </ion-content>

    <!-- Native Fixed Floating Action Button (Replaces ion-fab) -->
    <ion-button (click)="onNewEntry()" [style.bottom]="'calc(env(safe-area-inset-bottom, 0px) + 24px)'" class="fixed right-5 z-[99] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[var(--ion-color-warning)] shadow-[0_6px_16px_rgba(var(--ion-color-warning-rgb),0.4)] transition-transform active:scale-95 sm:bottom-8 sm:right-8" style="--border-radius: 50%;">
      <ion-icon name="add" class="text-[32px] text-white"></ion-icon>
    </ion-button>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, VisitCalendarComponent, CommonInputComponent, FormsModule, CommonButtonComponent, CommonCardComponent]
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
  private selectedTab$ = new BehaviorSubject<'all' | 'walk-in' | 'pre-approved'>('all');
  private searchTerm$ = new BehaviorSubject<string>('');
  searchTerm: string = '';

  onTabChange(tab: 'all' | 'walk-in' | 'pre-approved') {
    this.selectedTab$.next(tab);
  }

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

      this.visitorsForSelectedDate$ = combineLatest([this.visitors$, this.selectedDate$, this.searchTerm$, this.selectedTab$]).pipe(
        map(([list, selectedDate, searchTerm, tab]) => {
          let filtered = [...list].filter((v) => this.toLocalIsoDate(this.getVisitorDate(v)) === selectedDate);
          if (searchTerm) {
            filtered = filtered.filter(v => v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) || v.mobile?.includes(searchTerm));
          }
          if (tab === 'walk-in') {
            filtered = filtered.filter(v => v.purpose !== 'Pre-Approved Guest');
          } else if (tab === 'pre-approved') {
            filtered = filtered.filter(v => v.purpose === 'Pre-Approved Guest');
          }
          return filtered.sort((a, b) => this.getVisitorDate(b).getTime() - this.getVisitorDate(a).getTime());
        })
      );
    });
  }

  onSearchChange(ev: any) {
    const term = typeof ev === 'string' ? ev : ev?.target?.value || '';
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
