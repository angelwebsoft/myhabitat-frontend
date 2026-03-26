import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { CommonSelectComponent } from '../../../components/common-select/common-select.component';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gatekeeper-new-visitor',
  templateUrl: './new-visitor.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent, CommonCardComponent, CommonInputComponent, CommonSelectComponent, FormsModule]
})
export class NewVisitorPage implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  form = {
    visitorName: '',
    mobile: '',
    flatNumber: '',
    purpose: '',
    photoURL: ''
  };

  flatOptions: { label: string; value: string }[] = [];

  get isValid() {
    return this.form.visitorName && this.form.mobile && this.form.flatNumber;
  }

  async ngOnInit() {
    const user = this.authService.currentUser$.value;
    if (user) {
      const residents = await this.dataService.getUsersBySocietyAndRole(user.societyId, 'resident');
      this.flatOptions = residents
        .filter(r => r.flatNumber)
        .map(r => ({ label: `Flat ${r.flatNumber}`, value: r.flatNumber! }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  async onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.form.photoURL = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    const loader = await this.loadingCtrl.create({ message: 'Authorizing entry...' });
    await loader.present();
    try {
      const user = this.authService.currentUser$.value;
      if (!user) return;

      const resident = await this.dataService.findResidentByFlat(this.form.flatNumber, user.societyId);

      await this.dataService.addVisitor({
        visitorName: this.form.visitorName,
        mobile: this.form.mobile,
        flatNumber: this.form.flatNumber,
        purpose: this.form.purpose,
        photoURL: this.form.photoURL,
        societyId: user.societyId,
        gatekeeperId: user.id,
        residentId: resident?.id || '',
        status: 'checked-in',
        checkInTime: new Date(),
        checkOutTime: null
      });

      const toast = await this.toastCtrl.create({
        message: 'Visitor successfully authorized and checked-in!',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      this.router.navigate(['/gatekeeper']);
    } catch (e) {
      console.error(e);
    } finally {
      loader.dismiss();
    }
  }
}
