import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { DashboardHeaderComponent } from '../../../components/dashboard-header/dashboard-header.component';
import { VisitCalendarComponent } from '../../../components/visit-calendar/visit-calendar.component';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Observable, Subscription, of } from 'rxjs';
import { Visitor } from '../../../models/visitor.model';

@Component({
  selector: 'app-resident-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, CommonCardComponent, CommonInputComponent, DashboardHeaderComponent, VisitCalendarComponent],
  host: { 'class': 'resident-theme flex flex-col min-h-full' }
})
export class ResidentDashboardPage implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;
  visitors$: Observable<Visitor[]> = of([]);
  private sub?: Subscription;

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(async user => {
      if (!user) return;
      const visitorStream = await this.dataService.getVisitorsBySociety(user.societyId, user.id);
      this.visitors$ = visitorStream;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onPreApprove() {
    this.router.navigate(['/resident/pre-approve']);
  }
}
