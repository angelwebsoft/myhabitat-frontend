import { Component, OnInit, ViewChild, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, IonModal, LoadingController, ToastController } from '@ionic/angular';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/visitor.model';
import { ActivatedRoute } from '@angular/router';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';
import { CommonButtonComponent } from '../../../components/common-button/common-button.component';
import { ApiService } from '../../../services/api.service';
import { MaintenanceBill } from '../../../models/visitor.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-residents',
  templateUrl: './residents.page.html',
  standalone: true,
  styles: [`
    .badge-status {
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
  `],
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, CommonInputComponent, CommonCardComponent, CommonButtonComponent]
})
export class AdminResidentsPage implements OnInit {
  @ViewChild('addModal') addModal?: IonModal;
  @ViewChild('editModal') editModal?: IonModal;

  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  viewRole: User['role'] = 'resident';

  selectedUser: User | null = null;
  isDetailsModalOpen = false;
  isAddModalOpen = false;
  isEditModalOpen = false;
  isEditing = false;

  maintenanceBills: MaintenanceBill[] = [];
  isLoadingMaintenance = false;

  newUser: { userName: string; mobileNumber: string; flatNumber: string; vehicleNumber: string; photoURL: string; residentType: 'owner' | 'tenant' } = {
    userName: '',
    mobileNumber: '',
    flatNumber: '',
    vehicleNumber: '',
    photoURL: '',
    residentType: 'owner'
  };

  editingUser: { id: string; userName: string; mobileNumber: string; flatNumber: string; vehicleNumber: string; role: User['role']; photoURL: string; residentType: 'owner' | 'tenant' } = {
    id: '',
    userName: '',
    mobileNumber: '',
    flatNumber: '',
    vehicleNumber: '',
    role: 'resident',
    photoURL: '',
    residentType: 'owner'
  };

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  ngOnInit() {
    const viewRoleFromRoute = this.route.snapshot.data?.['viewRole'] as User['role'] | undefined;
    if (viewRoleFromRoute) {
      this.viewRole = viewRoleFromRoute;
    }
    this.loadUsers();
  }

  private async loadUsers() {
    const user = this.authService.currentUser$.value;
    if (!user) return;
    const list = await this.dataService.getUsersBySocietyAndRole(user.societyId, this.viewRole);
    this.users = list;
    this.filterUsers();
  }

  filterUsers() {
    if (!this.searchTerm) {
      this.filteredUsers = [...this.users];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.userName.toLowerCase().includes(term) ||
      (u.flatNumber?.toLowerCase().includes(term)) ||
      u.mobileNumber.includes(term) ||
      u.uniqueId.toLowerCase().includes(term) ||
      (u.vehicleNumber?.toLowerCase().includes(term))
    );
  }

  addUser() {
    this.newUser = { userName: '', mobileNumber: '', flatNumber: '', vehicleNumber: '', photoURL: '', residentType: 'owner' };
    this.isEditing = false;
    this.isAddModalOpen = true;
  }

  editUser(user: User) {
    this.editingUser = {
      id: user.id,
      userName: user.userName || '',
      mobileNumber: user.mobileNumber || '',
      flatNumber: user.flatNumber || '',
      vehicleNumber: user.vehicleNumber || '',
      role: user.role,
      photoURL: user.photoURL || '',
      residentType: user.residentType || 'owner'
    };
    this.isEditing = true;
    this.isEditModalOpen = true;
  }

  async saveUser() {
    if (!this.newUser.userName || !this.newUser.mobileNumber) return;
    const user = this.authService.currentUser$.value;
    if (!user) return;

    const loading = await this.loadingCtrl.create({ message: 'Registering...' });
    await loading.present();
    try {
      const createdUser = await this.dataService.createUser({
        uniqueId: `${this.viewRole.slice(0, 3)}_${Date.now().toString(36)}`,
        userName: this.newUser.userName.trim(),
        mobileNumber: this.newUser.mobileNumber.trim(),
        role: this.viewRole,
        flatNumber: this.viewRole === 'resident' ? this.newUser.flatNumber.trim().toUpperCase() : undefined,
        residentType: this.viewRole === 'resident' ? this.newUser.residentType : undefined,
        vehicleNumber: this.newUser.vehicleNumber.trim() || undefined,
        photoURL: this.newUser.photoURL || undefined,
        societyId: user.societyId
      });

      // Auto-generate maintenance bill for new residents
      if (this.viewRole === 'resident' && createdUser.uniqueId) {
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const now = new Date();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const dueDate = new Date(now.setDate(now.getDate() + 15)).toISOString();
        const amount = this.newUser.residentType === 'tenant' ? 1500 : 1000;

        await firstValueFrom(this.apiService.createBill({
          flat_number: createdUser.flatNumber || this.newUser.flatNumber.toUpperCase(),
          resident_id: createdUser.uniqueId,
          amount,
          month,
          year,
          due_date: dueDate,
          society_id: user.societyId
        }));
      }
      this.isAddModalOpen = false;
      await this.loadUsers();
      const toast = await this.toastCtrl.create({ message: 'User added successfully', duration: 2000, color: 'success' });
      toast.present();
    } catch (err: any) {
      const toast = await this.toastCtrl.create({ message: err?.message || 'Failed to add user', duration: 3000, color: 'danger' });
      toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async saveEdit() {
    const currentAdmin = this.authService.currentUser$.value;
    if (!currentAdmin) return;

    const loading = await this.loadingCtrl.create({ message: 'Updating...' });
    await loading.present();
    try {
      await this.dataService.updateUser(this.editingUser.id, {
        userName: this.editingUser.userName.trim(),
        mobileNumber: this.editingUser.mobileNumber.trim(),
        role: this.editingUser.role,
        flatNumber: this.editingUser.role === 'resident' ? this.editingUser.flatNumber.trim().toUpperCase() : undefined,
        residentType: this.editingUser.role === 'resident' ? this.editingUser.residentType : undefined,
        vehicleNumber: this.editingUser.vehicleNumber.trim() || undefined,
        photoURL: this.editingUser.photoURL || undefined,
        societyId: currentAdmin.societyId
      });
      this.isEditModalOpen = false;
      await this.loadUsers();
      const toast = await this.toastCtrl.create({ message: 'User updated', duration: 2000, color: 'success' });
      toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async deleteUser(userId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Delete User?',
      message: 'This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Deleting...' });
            await loading.present();
            try {
              await this.dataService.deleteUser(userId);
              await this.loadUsers();
              const toast = await this.toastCtrl.create({ message: 'User deleted', duration: 2000, color: 'success' });
              toast.present();
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async viewDetails(user: User) {
    this.selectedUser = user;
    this.isDetailsModalOpen = true;
    this.maintenanceBills = [];

    if (user.role === 'resident') {
      this.isLoadingMaintenance = true;
      this.apiService.getMyBills(user.uniqueId).subscribe({
        next: (bills) => {
          this.maintenanceBills = bills;
          this.isLoadingMaintenance = false;
        },
        error: () => {
          this.isLoadingMaintenance = false;
        }
      });
    }
  }

  takePhoto(isNew: boolean) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re: any) => {
          if (isNew) this.newUser.photoURL = re.target.result;
          else this.editingUser.photoURL = re.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }
}
