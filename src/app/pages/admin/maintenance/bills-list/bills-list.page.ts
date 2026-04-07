import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, AlertController, ToastController } from '@ionic/angular';
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
    private alertCtrl = inject(AlertController);
    private toastCtrl = inject(ToastController);

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

    async generateAll() {
        const user = await firstValueFrom(this.auth.currentUser$);
        if (!user?.societyId) return;

        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const now = new Date();
        const currentMonth = months[now.getMonth()];
        const currentYear = now.getFullYear();
        const dueDate = new Date(now.setDate(now.getDate() + 15)).toISOString();

        const alert = await this.alertCtrl.create({
            header: 'Generate All Bills',
            message: `Do you want to generate maintenance bills for ALL residents for ${currentMonth} ${currentYear}?`,
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Generate',
                    handler: () => {
                        this.isLoading = true;
                        this.api.generateAllBills({
                            societyId: user.societyId!,
                            month: currentMonth,
                            year: currentYear,
                            dueDate: dueDate
                        }).subscribe({
                            next: async (res: any) => {
                                const toast = await this.toastCtrl.create({
                                    message: res.message + ` (${res.summary.created} new bills)`,
                                    duration: 3000,
                                    color: 'success'
                                });
                                toast.present();
                                this.loadBills();
                            },
                            error: async (err) => {
                                this.isLoading = false;
                                const toast = await this.toastCtrl.create({
                                    message: err.error?.error || 'Failed to generate bills',
                                    duration: 3000,
                                    color: 'danger'
                                });
                                toast.present();
                            }
                        });
                    }
                }
            ]
        });

        await alert.present();
    }

    async deleteBill(bill: MaintenanceBill) {
        const alert = await this.alertCtrl.create({
            header: 'Delete Bill',
            message: `Are you sure you want to delete the bill for Flat ${bill.flatNumber} (${bill.month} ${bill.year})?`,
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.api.deleteBill(bill.id).subscribe({
                            next: async () => {
                                const toast = await this.toastCtrl.create({
                                    message: 'Bill deleted successfully',
                                    duration: 2000,
                                    color: 'success'
                                });
                                toast.present();
                                this.loadBills();
                            },
                            error: async (err) => {
                                const toast = await this.toastCtrl.create({
                                    message: err.error?.error || 'Failed to delete bill',
                                    duration: 3000,
                                    color: 'danger'
                                });
                                toast.present();
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    async editBill(bill: MaintenanceBill) {
        const alert = await this.alertCtrl.create({
            header: 'Edit Bill',
            inputs: [
                {
                    name: 'amount',
                    type: 'number',
                    placeholder: 'Amount',
                    value: bill.amount
                },
                {
                    name: 'month',
                    type: 'text',
                    placeholder: 'Month',
                    value: bill.month
                },
                {
                    name: 'year',
                    type: 'number',
                    placeholder: 'Year',
                    value: bill.year
                }
            ],
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Update',
                    handler: (data) => {
                        if (!data.amount || !data.month || !data.year) return false;

                        this.api.updateBill(bill.id, {
                            amount: Number(data.amount),
                            month: data.month,
                            year: Number(data.year)
                        }).subscribe({
                            next: async () => {
                                const toast = await this.toastCtrl.create({
                                    message: 'Bill updated successfully',
                                    duration: 2000,
                                    color: 'success'
                                });
                                toast.present();
                                this.loadBills();
                            },
                            error: async (err) => {
                                const toast = await this.toastCtrl.create({
                                    message: err.error?.error || 'Failed to update bill',
                                    duration: 3000,
                                    color: 'danger'
                                });
                                toast.present();
                            }
                        });
                        return true;
                    }
                }
            ]
        });
        await alert.present();
    }
}
