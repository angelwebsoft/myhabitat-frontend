import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Visitor } from '../../../models/visitor.model';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { VisitCalendarComponent } from '../../../components/visit-calendar/visit-calendar.component';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, VisitCalendarComponent]
})
export class AdminDashboardPage implements OnInit {
  visitors: Visitor[] = [];
  totalVisits = 0;
  activeVisitors = 0;
  headerTitle = 'Admin Overview';

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.authService.currentUser$.subscribe(async user => {
      if (user) {
        this.headerTitle = 'Admin Dashboard';
        this.visitors = await this.dataService.getAllVisitors(user.societyId);
        this.totalVisits = this.visitors.length;
        this.activeVisitors = this.visitors.filter(v => v.status === 'checked-in').length;
      }
    });
  }

  manageResidents() {
    this.router.navigate(['/admin/users/residents']);
  }

  manageGatekeepers() {
    this.router.navigate(['/admin/users/gatekeepers']);
  }

  manageAdmins() {
    this.router.navigate(['/admin/users/admins']);
  }

  exportCsv() {
    if (this.visitors.length === 0) return;

    const headers = 'Visitor,Mobile,Flat,Status,Check-In,Check-Out\n';
    const csvContent = this.visitors.map(v =>
      `${v.visitorName},${v.mobile},${v.flatNumber},${v.status},${v.checkInTime},${v.checkOutTime}`
    ).join('\n');

    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-logs-${new Date().toISOString()}.csv`;
    a.click();
  }

  onLogout() {
    this.authService.logout();
  }
}
