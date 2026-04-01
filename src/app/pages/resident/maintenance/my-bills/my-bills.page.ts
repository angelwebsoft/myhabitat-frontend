import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { ApiService } from '../../../../services/api.service';
import { MaintenanceBill } from '../../../../models/visitor.model';
import { AppHeaderComponent } from '../../../../components/app-header/app-header.component';
import { AuthService } from '../../../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-my-bills',
    templateUrl: './my-bills.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, AppHeaderComponent]
})
export class MyBillsPage implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private toastCtrl = inject(ToastController);
    private alertCtrl = inject(AlertController);

    bills: MaintenanceBill[] = [];
    isLoading = true;

    async ngOnInit() {
        this.loadMyBills();
    }

    async loadMyBills() {
        this.isLoading = true;
        const user = await firstValueFrom(this.auth.currentUser$);
        if (user?.uniqueId) {
            this.api.getMyBills(user.uniqueId).subscribe({
                next: (bills) => {
                    this.bills = bills;
                    this.isLoading = false;
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('[my-bills] Load error:', err);
                }
            });
        }
    }

    async markAsPaid(bill: MaintenanceBill) {
        const alert = await this.alertCtrl.create({
            header: 'Confirm Payment',
            message: `Mark bill for ${bill.month} ${bill.year} (₹${bill.amount}) as paid?`,
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Confirm',
                    handler: () => {
                        this.processPayment(bill);
                    }
                }
            ]
        });
        await alert.present();
    }

    processPayment(bill: MaintenanceBill) {
        this.api.payBill({
            bill_id: bill.id,
            amount: bill.amount,
            payment_mode: 'cash' // Simplified for now
        }).subscribe({
            next: async (res) => {
                const toast = await this.toastCtrl.create({
                    message: 'Payment marked successfully',
                    duration: 2000,
                    color: 'success'
                });
                toast.present();
                this.loadMyBills();
            },
            error: async (err) => {
                const toast = await this.toastCtrl.create({
                    message: err.error?.message || 'Payment failed',
                    duration: 2000,
                    color: 'danger'
                });
                toast.present();
            }
        });
    }
}
