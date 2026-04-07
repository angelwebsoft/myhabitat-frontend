import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { DashboardHeaderComponent } from '../../../components/dashboard-header/dashboard-header.component';
import { VisitCalendarComponent } from '../../../components/visit-calendar/visit-calendar.component';
import { CommonQrComponent } from '../../../components/common-qr/common-qr.component';
import { CommonVisitorDetailsComponent } from '../../../components/common-visitor-details/common-visitor-details.component';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Observable, Subscription, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Visitor } from '../../../models/visitor.model';

@Component({
  selector: 'app-resident-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, CommonCardComponent, CommonInputComponent, DashboardHeaderComponent, VisitCalendarComponent, CommonQrComponent, CommonVisitorDetailsComponent],
  host: { 'class': 'resident-theme flex flex-col min-h-full' }
})
export class ResidentDashboardPage implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);

  currentUser$ = this.authService.currentUser$;

  visitors$: Observable<Visitor[]> = of([]);
  pendingWalkIns$: Observable<Visitor[]> = of([]);

  selectedVisitor: Visitor | null = null;
  isDetailsModalOpen = false;
  isQrModalOpen = false;
  qrTokenForLargeView = '';
  private sub?: Subscription;

  async approveVisitor(visitor: Visitor) {
    const loader = await this.loadingCtrl.create({ message: 'Approving entry...' });
    await loader.present();
    try {
      await this.dataService.updateVisitorStatus(visitor.id, 'checked-in', { checkInTime: new Date() });
    } finally {
      loader.dismiss();
    }
  }

  async rejectVisitor(visitor: Visitor) {
    const loader = await this.loadingCtrl.create({ message: 'Rejecting entry...' });
    await loader.present();
    try {
      await this.dataService.updateVisitorStatus(visitor.id, 'rejected');
    } finally {
      loader.dismiss();
    }
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

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(async user => {
      if (!user) return;
      const visitorStream = await this.dataService.getVisitorsBySociety(user.societyId, user.id);
      this.visitors$ = visitorStream;

      this.pendingWalkIns$ = visitorStream.pipe(
        map(list => list.filter(v => v.status === 'pending' && v.gatekeeperId))
      );
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onPreApprove() {
    this.router.navigate(['/resident/pre-approve']);
  }

  onMaintenance() {
    this.router.navigate(['/resident/maintenance']);
  }
}
