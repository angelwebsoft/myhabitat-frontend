import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { ApiService } from '../../../../services/api.service';
import { MaintenanceBill } from '../../../../models/visitor.model';
import { AppHeaderComponent } from '../../../../components/app-header/app-header.component';
import { AuthService } from '../../../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-bills-list',
    templateUrl: './bills-list.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, AppHeaderComponent]
})
export class BillsListPage implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private navCtrl = inject(NavController);

    bills: MaintenanceBill[] = [];
    isLoading = true;

    async ngOnInit() {
        this.loadBills();
    }

    ionViewWillEnter() {
        this.loadBills();
    }

    async loadBills() {
        this.isLoading = true;
        const user = await firstValueFrom(this.auth.currentUser$);
        if (user?.societyId) {
            this.api.getAllBills(user.societyId).subscribe({
                next: (bills) => {
                    this.bills = bills;
                    this.isLoading = false;
                },
                error: () => {
                    this.isLoading = false;
                }
            });
        }
    }

    goToCreate() {
        this.navCtrl.navigateForward('admin/maintenance/create');
    }
}
