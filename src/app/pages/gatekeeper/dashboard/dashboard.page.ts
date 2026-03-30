import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Visitor } from '../../../models/visitor.model';
import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { VisitCalendarComponent } from '../../../components/visit-calendar/visit-calendar.component';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { CommonButtonComponent } from 'src/app/components/common-button/common-button.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';
import { DashboardHeaderComponent } from '../../../components/dashboard-header/dashboard-header.component';
import { CommonQrComponent } from '../../../components/common-qr/common-qr.component';
import { CommonVisitorDetailsComponent } from '../../../components/common-visitor-details/common-visitor-details.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-gatekeeper-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, VisitCalendarComponent, CommonInputComponent, FormsModule, CommonButtonComponent, CommonCardComponent, DashboardHeaderComponent, CommonQrComponent, CommonVisitorDetailsComponent],
  host: { 'class': 'gatekeeper-theme flex flex-col min-h-full' }
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
  private selectedTab$ = new BehaviorSubject<'upcoming' | 'walk-in' | 'pre-approved'>('upcoming');
  private searchTerm$ = new BehaviorSubject<string>('');
  searchTerm: string = '';
  selectedVisitor: Visitor | null = null;
  isDetailsModalOpen = false;
  isQrModalOpen = false;
  qrTokenForLargeView = '';

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);

  constructor() { }

  onTabChange(tab: 'upcoming' | 'walk-in' | 'pre-approved') {
    this.selectedTab$.next(tab);
  }

  viewVisitorDetails(visitor: Visitor) {
    this.selectedVisitor = visitor;
    this.isDetailsModalOpen = true;
  }

  showFullQr(token: string) {
    this.qrTokenForLargeView = token;
    this.isQrModalOpen = true;
  }

  closeQrModal() {
    this.isQrModalOpen = false;
  }

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

      const visitorsStream = await this.dataService.getVisitorsBySociety(user.societyId);
      this.visitors$ = visitorsStream.pipe(
        map(list => [...list].sort((a, b) => this.getStatusPriority(a.status) - this.getStatusPriority(b.status)))
      );

      this.visitorsForSelectedDate$ = combineLatest([this.visitors$, this.selectedDate$, this.searchTerm$, this.selectedTab$]).pipe(
        map(([list, selectedDate, searchTerm, tab]) => {
          const today = this.toLocalIsoDate(new Date());
          let filtered = [...list];

          // 1. Tab/Date Filter
          if (tab === 'upcoming') {
            filtered = filtered.filter(v =>
              v.purpose === 'Pre-Approved Guest' &&
              v.status === 'pending' &&
              this.toLocalIsoDate(this.getVisitorDate(v)) >= today
            );
          } else if (tab === 'walk-in') {
            filtered = filtered.filter(v =>
              this.toLocalIsoDate(this.getVisitorDate(v)) === selectedDate &&
              v.purpose !== 'Pre-Approved Guest'
            );
          } else if (tab === 'pre-approved') {
            filtered = filtered.filter(v =>
              this.toLocalIsoDate(this.getVisitorDate(v)) === selectedDate &&
              v.purpose === 'Pre-Approved Guest'
            );
          }

          // 2. Search Filter
          if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(v =>
              v.visitorName.toLowerCase().includes(s) ||
              v.mobile?.includes(s) ||
              v.vehicleNumber?.toLowerCase().includes(s)
            );
          }

          return filtered.sort((a, b) => this.getVisitorDate(b).getTime() - this.getVisitorDate(a).getTime());
        })
      );
    });
  }

  onSearchInternal(val: any) {
    this.searchTerm = val;
    this.searchTerm$.next(val);
  }

  ionViewWillEnter() {
    if (this.currentSocietyId && this.currentGatekeeperId) {
      this.dataService.refreshVisitorsForSociety(this.currentSocietyId).catch(error => {
        console.error('Failed to refresh gatekeeper visitors on enter', error);
      });
    }

    // Checking strictly inside ionViewWillEnter handles Ionic's cached page routing
    const state = this.location.getState() as any;
    if (state && state['openVisitor']) {
      this.selectedVisitor = state['openVisitor'];
      this.isDetailsModalOpen = true;
      // Clear the state so it doesn't blindly trigger again if we re-visit the dashboard from somewhere else
      this.location.replaceState('/gatekeeper', '', null);
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
}
