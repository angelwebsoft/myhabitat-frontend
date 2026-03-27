import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';
import { DashboardHeaderComponent } from '../../../components/dashboard-header/dashboard-header.component';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { map, switchMap, from } from 'rxjs';

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
         if (!user) return from(Promise.resolve({ residents: 0, gatekeepers: 0, admins: 0 }));

         return from(Promise.all([
            this.dataService.getUsersBySocietyAndRole(user.societyId, 'resident'),
            this.dataService.getUsersBySocietyAndRole(user.societyId, 'gatekeeper'),
            this.dataService.getUsersBySocietyAndRole(user.societyId, 'admin')
         ]).then(([res, gate, adm]) => ({
            residents: res.length,
            gatekeepers: gate.length,
            admins: adm.length
         })));
      })
   );

   ngOnInit() { }

   goTo(path: string) {
      this.router.navigate([path]);
   }

   onLogout() {
      this.authService.logout();
   }
}
