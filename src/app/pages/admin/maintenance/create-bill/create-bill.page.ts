import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { ApiService } from '../../../../services/api.service';
import { User } from '../../../../models/visitor.model';
import { AppHeaderComponent } from '../../../../components/app-header/app-header.component';
import { CommonButtonComponent } from '../../../../components/common-button/common-button.component';
import { AuthService } from '../../../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-create-bill',
    templateUrl: './create-bill.page.html',
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, CommonButtonComponent]
})
export class CreateBillPage implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private toastCtrl = inject(ToastController);
    private navCtrl = inject(NavController);

    residents: User[] = [];
    selectedResidentId: string = '';
    amount: number | null = null;
    month: string = '';
    year: number = new Date().getFullYear();
    dueDate: string = new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0];

    months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    async ngOnInit() {
        const user = await firstValueFrom(this.auth.currentUser$);
        if (user?.societyId) {
            this.api.getUsers({ role: 'resident', societyId: user.societyId }).subscribe(users => {
                this.residents = users;
            });
        }

        // Default to current month
        this.month = this.months[new Date().getMonth()];
    }

    async onSubmit() {
        if (!this.selectedResidentId || !this.amount || !this.month || !this.year || !this.dueDate) {
            const toast = await this.toastCtrl.create({
                message: 'Please fill all fields',
                duration: 2000,
                color: 'warning'
            });
            toast.present();
            return;
        }

        const resident = this.residents.find(r => r.uniqueId === this.selectedResidentId);
        const user = await firstValueFrom(this.auth.currentUser$);

        if (!resident || !user?.societyId) return;

        const payload = {
            flat_number: resident.flatNumber || '',
            resident_id: resident.uniqueId,
            amount: this.amount!,
            month: this.month,
            year: this.year,
            due_date: new Date(this.dueDate).toISOString(),
            society_id: user.societyId
        };

        this.api.createBill(payload).subscribe({
            next: async (res) => {
                const toast = await this.toastCtrl.create({
                    message: 'Bill created successfully',
                    duration: 2000,
                    color: 'success'
                });
                toast.present();
                this.navCtrl.back();
            },
            error: async (err) => {
                const message = err.error?.message || err.error?.error || 'Failed to create bill';
                const toast = await this.toastCtrl.create({
                    message: message,
                    duration: 3000,
                    color: 'danger'
                });
                toast.present();
            }
        });
    }
}
