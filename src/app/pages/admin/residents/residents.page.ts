import { Component, OnInit, ViewChild, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, IonModal, LoadingController, ToastController } from '@ionic/angular';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/visitor.model';
import { ActivatedRoute } from '@angular/router';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonSelectComponent } from '../../../components/common-select/common-select.component';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';

@Component({
  selector: 'app-admin-residents',
  templateUrl: './residents.page.html',
  standalone: true,

  styles: [`
    ion-content.residents-content {
      --padding-top: 76px;
    }

    .residents-search {
      left: 0;
      right: 0;
      background: var(--ion-background-color, #fff);
      z-index: 10;
    }

    .logout-btn {
      --border-radius: 999px;
      --padding-start: 0;
      --padding-end: 0;
      height: 34px;
      margin:0;
    }
  `],

  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, CommonSelectComponent, CommonInputComponent, CommonCardComponent]
})
export class AdminResidentsPage implements OnInit {
  @ViewChild('addModal') addModal?: IonModal;
  @ViewChild('editModal') editModal?: IonModal;
  @Input() showMenuButton = true;
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  activeRole: User['role'] = 'resident';
  headerTitle: string = 'Manage Users';
  sectionTitle: string = 'List';

  form: { userName: string; mobileNumber: string; flatNumber: string; photoURL: string } = {
    userName: '',
    mobileNumber: '',
    flatNumber: '',
    photoURL: ''
  };

  editForm: { id: string; userName: string; mobileNumber: string; flatNumber: string; role: User['role']; photoURL: string } = {
    id: '',
    userName: '',
    mobileNumber: '',
    flatNumber: '',
    role: 'resident',
    photoURL: ''
  };

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private route = inject(ActivatedRoute);

  get flatOptions(): string[] {
    const flats = this.users
      .map(u => (u.flatNumber || '').trim())
      .filter(Boolean)
      .map(f => f.toUpperCase());
    return Array.from(new Set(flats)).sort((a, b) => a.localeCompare(b));
  }

  get flatOptionsFormatted(): { label: string; value: string }[] {
    return this.flatOptions.map(f => ({ label: f, value: f }));
  }

  ngOnInit() {
    const viewRoleFromRoute = this.route.snapshot.data?.['viewRole'] as User['role'] | undefined;
    if (viewRoleFromRoute === 'resident' || viewRoleFromRoute === 'gatekeeper' || viewRoleFromRoute === 'admin') {
      this.activeRole = viewRoleFromRoute;
    } else {
      const roleFromQuery = this.route.snapshot.queryParamMap.get('role') as User['role'] | null;
      if (roleFromQuery === 'resident' || roleFromQuery === 'gatekeeper' || roleFromQuery === 'admin') {
        this.activeRole = roleFromQuery;
      }
    }
    this.loadUsers();
  }

  private async loadUsers() {
    const user = this.authService.currentUser$.value;
    if (!user) return;
    const roleLabel =
      this.activeRole === 'resident' ? 'Residents' :
        this.activeRole === 'gatekeeper' ? 'Gatekeepers' :
          'Admins';
    this.headerTitle = `${roleLabel} Listing`;

    const list = await this.dataService.getUsersBySocietyAndRole(user.societyId, this.activeRole);
    this.users = list;
    this.filterUsers();
  }

  async onRoleChange() {
    // Role is driven by route now (separate screens).
    return;
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
      u.uniqueId.toLowerCase().includes(term)
    );
  }

  isValid() {
    if (!this.form.userName || !this.form.mobileNumber) return false;
    if (this.activeRole === 'resident' && !this.form.flatNumber) return false;
    return true;
  }

  async addUser() {
    const user = this.authService.currentUser$.value;
    if (!user) return;

    const loading = await this.loadingCtrl.create({ message: 'Registering...' });
    await loading.present();
    try {
      await this.dataService.createUser({
        uniqueId: `${this.activeRole.slice(0, 3)}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        userName: this.form.userName.trim(),
        mobileNumber: this.form.mobileNumber.trim(),
        role: this.activeRole,
        flatNumber: this.activeRole === 'resident' ? this.form.flatNumber.trim().toUpperCase() : undefined,
        photoURL: this.form.photoURL || undefined,
        societyId: user.societyId
      });
      this.form = { userName: '', mobileNumber: '', flatNumber: '', photoURL: '' };
      await this.loadUsers();
      await this.addModal?.dismiss();
      this.sectionTitle = 'List';
      const toast = await this.toastCtrl.create({
        message: `${this.activeRole} registered successfully`,
        duration: 2000,
        color: 'success'
      });
      toast.present();
    } catch (err: any) {
      const toast = await this.toastCtrl.create({
        message: err?.message || 'Failed to register resident',
        duration: 3000,
        color: 'danger'
      });
      toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async addDemoResidents() {
    const user = this.authService.currentUser$.value;
    if (!user) return;
    const loading = await this.loadingCtrl.create({ message: 'Seeding demo data...' });
    await loading.present();
    try {
      await this.dataService.seedDemoResidents(user.societyId);
      await this.loadUsers();
      const toast = await this.toastCtrl.create({
        message: 'Demo residents added successfully',
        duration: 2500,
        color: 'success'
      });
      toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const user = this.authService.currentUser$.value;
    if (!user) return;

    const loading = await this.loadingCtrl.create({ message: 'Importing data...' });
    await loading.present();

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) throw new Error('JSON must be an array');

      const cleaned = data
        .filter((item: any) => item && (item.userName || item.name) && (item.mobileNumber || item.mobile) && item.flatNumber)
        .map((item: any) => ({
          userName: String(item.userName || item.name).trim(),
          mobileNumber: String(item.mobileNumber || item.mobile).trim(),
          flatNumber: String(item.flatNumber).trim().toUpperCase(),
          societyId: user.societyId
        }));

      if (!cleaned.length) throw new Error('No valid residents found');

      for (const r of cleaned) {
        await this.dataService.createUser({
          uniqueId: `res_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
          userName: r.userName,
          mobileNumber: r.mobileNumber,
          role: 'resident',
          flatNumber: r.flatNumber,
          societyId: r.societyId
        });
      }

      await this.loadUsers();
      this.sectionTitle = 'List';
      const toast = await this.toastCtrl.create({
        message: `Imported ${cleaned.length} residents`,
        duration: 3000,
        color: 'success'
      });
      toast.present();
    } catch (err: any) {
      const toast = await this.toastCtrl.create({ message: err?.message || 'Import failed', duration: 3000, color: 'danger' });
      toast.present();
    } finally {
      loading.dismiss();
      input.value = '';
    }
  }

  async onPhotoSelected(event: Event, target: 'add' | 'edit') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await this.readAndCompressImage(file);
      if (target === 'add') {
        this.form.photoURL = dataUrl;
      } else {
        this.editForm.photoURL = dataUrl;
      }
    } catch (e) {
      console.error(e);
      const toast = await this.toastCtrl.create({ message: 'Failed to process photo', duration: 2500, color: 'danger' });
      toast.present();
    } finally {
      input.value = '';
    }
  }

  openEdit(user: User) {
    this.editForm = {
      id: user.id,
      userName: user.userName || '',
      mobileNumber: user.mobileNumber || '',
      flatNumber: user.flatNumber || '',
      role: user.role,
      photoURL: user.photoURL || ''
    };
    queueMicrotask(() => this.editModal?.present());
  }

  openAdd() {
    this.sectionTitle = 'Add';
    queueMicrotask(() => this.addModal?.present());
  }

  closeAdd() {
    this.addModal?.dismiss();
    this.sectionTitle = 'List';
  }
  closeEdit() {
    this.editModal?.dismiss();
    this.sectionTitle = 'List';
  }

  async saveEdit() {
    const currentAdmin = this.authService.currentUser$.value;
    if (!currentAdmin) return;

    const loading = await this.loadingCtrl.create({ message: 'Updating...' });
    await loading.present();
    try {
      await this.dataService.updateUser(this.editForm.id, {
        userName: this.editForm.userName.trim(),
        mobileNumber: this.editForm.mobileNumber.trim(),
        role: this.editForm.role,
        flatNumber: this.editForm.role === 'resident' ? this.editForm.flatNumber.trim().toUpperCase() : undefined,
        photoURL: this.editForm.photoURL || undefined,
        societyId: currentAdmin.societyId
      });
      await this.editModal?.dismiss();
      await this.loadUsers();
      const toast = await this.toastCtrl.create({ message: 'User updated', duration: 2000, color: 'success' });
      toast.present();
    } catch (err: any) {
      const toast = await this.toastCtrl.create({ message: err?.message || 'Update failed', duration: 2500, color: 'danger' });
      toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async deleteUser(user: User) {
    const loading = await this.loadingCtrl.create({ message: 'Deleting...' });
    await loading.present();
    try {
      await this.dataService.deleteUser(user.id);
      await this.loadUsers();
      const toast = await this.toastCtrl.create({ message: 'User deleted', duration: 2000, color: 'success' });
      toast.present();
    } catch (err: any) {
      const toast = await this.toastCtrl.create({ message: err?.message || 'Delete failed', duration: 2500, color: 'danger' });
      toast.present();
    } finally {
      loading.dismiss();
    }
  }

  async confirmDelete(user: User) {
    const alert = await this.alertCtrl.create({
      header: 'Delete User?',
      message: `Delete ${user.userName} (${user.role})? This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            // Fire-and-forget; deleteUser handles its own loader/toast.
            this.deleteUser(user).catch(err => console.error(err));
          }
        }
      ]
    });
    await alert.present();
  }

  private readAndCompressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.onload = async () => {
        try {
          const dataUrl = String(reader.result || '');
          const image = await this.loadImage(dataUrl);
          const max = 720;
          const scale = Math.min(max / image.width, max / image.height, 1);
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(dataUrl);
          ctx.drawImage(image, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Invalid image'));
      image.src = dataUrl;
    });
  }

  onLogout() {
    this.authService.logout();
  }
}
