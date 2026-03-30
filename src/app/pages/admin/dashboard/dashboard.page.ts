import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';
import { DashboardHeaderComponent } from '../../../components/dashboard-header/dashboard-header.component';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { map, switchMap, from, combineLatest, of } from 'rxjs';

import { Visitor } from '../../../models/visitor.model';

@Component({
   selector: 'app-admin-dashboard',
   templateUrl: './dashboard.page.html',
   standalone: true,
   imports: [CommonModule, IonicModule, AppHeaderComponent, CommonCardComponent, DashboardHeaderComponent],
   host: { 'class': 'admin-theme flex flex-col min-h-full' }
})
export class AdminDashboardPage implements OnInit {
   private router = inject(Router);
   private dataService = inject(DataService);
   private authService = inject(AuthService);

   currentUser$ = this.authService.currentUser$;

   stats$ = this.authService.currentUser$.pipe(
      switchMap(user => {
         if (!user) return from(Promise.resolve({ residents: 0, gatekeepers: 0, admins: 0, activeVisitors: 0, todayTotal: 0 }));

         return from(this.dataService.getVisitorsBySociety(user.societyId)).pipe(
            switchMap(visitors$ => combineLatest([
               from(this.dataService.getUsersBySocietyAndRole(user.societyId, 'resident')),
               from(this.dataService.getUsersBySocietyAndRole(user.societyId, 'gatekeeper')),
               from(this.dataService.getUsersBySocietyAndRole(user.societyId, 'admin')),
               visitors$
            ]).pipe(
               map(([res, gate, adm, visitors]) => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  return {
                     residents: res.length,
                     gatekeepers: gate.length,
                     admins: adm.length,
                     activeVisitors: (visitors || []).filter((v: Visitor) => v.status === 'checked-in').length,
                     todayTotal: (visitors || []).filter((v: Visitor) => {
                        const raw = (v.checkInTime || v.createdAt) as any;
                        const d = raw instanceof Date ? raw : new Date(raw);
                        return d.toISOString().slice(0, 10) === todayStr;
                     }).length
                  };
               })
            ))
         );
      })
   );

   ngOnInit() { }

   goTo(path: string, queryParams: any = {}) {
      this.router.navigate([path], { queryParams });
   }

   onLogout() {
      this.authService.logout();
   }
}
