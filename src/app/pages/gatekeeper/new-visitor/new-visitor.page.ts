import { Component, inject, OnInit, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonModal, LoadingController, ToastController, AlertController, ModalController, NavController } from '@ionic/angular';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { CameraService } from '../../../services/camera.service';
import { Router } from '@angular/router';
import { User } from '../../../models/visitor.model';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonSelectComponent } from '../../../components/common-select/common-select.component';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-new-visitor',
  template: `
    <app-header
      title="New Visitor Entry"
      color="warning"
      titleColor="dark"
      [showBack]="true"
      defaultHref="/gatekeeper"
      backButtonColor="dark"
    ></app-header>

    <ion-content color="light">
      <div class="px-3 pb-4 pt-3">
        <ion-card class="m-0 rounded-[20px] border border-black/[0.02] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <ion-card-content>
            <!-- Mobile Number Section -->
            <div class="mb-5">
              <ion-label class="mb-2 ml-1 block text-[13px] font-bold uppercase tracking-[0.5px] text-slate-800">Visitor Mobile Number</ion-label>
              <ion-item lines="none" class="[--background:#f1f5f9] [--border-radius:12px] [--highlight-color-focused:var(--ion-color-warning)] [--padding-start:12px]">
                <ion-icon name="phone-portrait-outline" slot="start"></ion-icon>
                <ion-input type="tel" [(ngModel)]="visitor.mobile" (ionBlur)="checkPreApproval()" placeholder="+91 1234567890"></ion-input>
              </ion-item>
            </div>

            <div class="animate__animated animate__pulse mb-5" *ngIf="isPreApproved">
              <ion-badge color="success" class="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-[13px] shadow-[0_4px_10px_rgba(var(--ion-color-success-rgb),0.2)]">
                <ion-icon name="sparkles"></ion-icon> &nbsp; Pre-Approved Guest Found!
              </ion-badge>
            </div>

            <!-- Name Section -->
            <div class="mb-5">
              <ion-label class="mb-2 ml-1 block text-[13px] font-bold uppercase tracking-[0.5px] text-slate-800">Visitor Name</ion-label>
              <ion-item lines="none" class="[--background:#f1f5f9] [--border-radius:12px] [--highlight-color-focused:var(--ion-color-warning)] [--padding-start:12px]">
                <ion-icon name="person-outline" slot="start"></ion-icon>
                <ion-input [(ngModel)]="visitor.visitorName" placeholder="John Doe"></ion-input>
              </ion-item>
            </div>

            <!-- Resident Selection Section (Selection Base) -->
            <div class="mb-5">
              <ion-label class="mb-2 ml-1 block text-[13px] font-bold uppercase tracking-[0.5px] text-slate-800">Visiting Resident / Flat</ion-label>
              <app-common-select
                lines="none"
                iconName="business-outline"
                placeholder="Select Resident..."
                [(ngModel)]="visitor.residentId"
                [options]="residentOptionsFormatted"
                (ngModelChange)="onResidentChange($event)">
              </app-common-select>
            </div>

            <!-- Purpose Section -->
            <div class="mb-5">
              <ion-label class="mb-2 ml-1 block text-[13px] font-bold uppercase tracking-[0.5px] text-slate-800">Purpose of Visit</ion-label>
              <ion-item lines="none" class="[--background:#f1f5f9] [--border-radius:12px] [--highlight-color-focused:var(--ion-color-warning)] [--padding-start:12px]">
                <ion-icon name="information-circle-outline" slot="start"></ion-icon>
                <ion-input [(ngModel)]="visitor.purpose" placeholder="Delivery, Courier, Guest..."></ion-input>
              </ion-item>
            </div>

            <!-- Photo Section -->
            <div class="my-6">
              <div class="relative flex h-[200px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[18px] border-2 border-dashed border-slate-300 bg-slate-100 transition-all sm:h-[220px]" [ngClass]="visitor.photoURL ? 'border-[var(--ion-color-warning)]' : ''" (click)="capturePhoto()">
                <div *ngIf="!visitor.photoURL" class="flex flex-col items-center justify-center text-center text-slate-500">
                  <ion-icon name="camera-outline" class="mb-2 text-[56px] text-slate-400"></ion-icon>
                  <span>Capture Visitor Photo</span>
                </div>
                <img *ngIf="visitor.photoURL" [src]="visitor.photoURL" />
                <div *ngIf="visitor.photoURL" class="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-[5px]">
                   <ion-icon name="camera-reverse"></ion-icon> Tap to Change
                </div>
              </div>
            </div>

            <ion-button expand="block" (click)="onSubmit()" class="mt-5 h-12 text-[15px] font-extrabold [--border-radius:14px] [--box-shadow:0_10px_20px_rgba(var(--ion-color-warning-rgb),0.3)] sm:h-14 sm:text-base" [color]="isPreApproved ? 'success' : 'warning'">
              {{ isPreApproved ? 'Check-In Pre-Approved Guest' : 'Submit for Approval' }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>


    </ion-content>

    <!-- Custom Success Modal Overlay -->
    <div *ngIf="showSuccessPopup" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm transition-all duration-300">
      <div class="animate__animated animate__zoomIn animate__faster w-full max-w-[320px] overflow-hidden rounded-[28px] bg-white text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <!-- Header/Icon -->
        <div class="bg-emerald-50 py-6">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ion-icon name="checkmark-circle" class="text-4xl"></ion-icon>
          </div>
        </div>
        
        <!-- Content -->
        <div class="px-6 pb-6 pt-5">
          <h3 class="mb-2 text-[22px] font-extrabold text-slate-800">Done</h3>
          <p class="mb-6 text-[14px] leading-relaxed text-slate-500">
            {{ isPreApproved ? 'Visitor has been Checked-In automatically.' : 'Approval request successfully sent to the resident.' }}
          </p>
          
          <button (click)="closeSuccessPopup()" class="w-full rounded-[14px] bg-emerald-500 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_16px_rgba(16,185,129,0.25)] transition-transform active:scale-95">
            Okay
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-search {
      --background: rgba(0,0,0,0.05);
      padding: 0 10px 10px 10px;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, CommonSelectComponent]
})
export class NewVisitorPage {
  @ViewChild(IonModal) residentModal?: IonModal;

  visitor: any = {
    visitorName: '',
    mobile: '',
    residentId: '',
    flatNumber: '',
    purpose: '',
    photoURL: ''
  };
  isPreApproved = false;
  showSuccessPopup = false;

  allResidents: User[] = [];
  selectedResident: User | null = null;

  get residentOptionsFormatted(): { label: string; value: any }[] {
    return this.allResidents.map(r => ({
      label: `${r.userName} (Flat ${r.flatNumber || 'N/A'})`,
      value: r.id
    }));
  }

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cameraService = inject(CameraService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);
  private navCtrl = inject(NavController);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private authSubscription?: Subscription;

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (!user || user.role !== 'gatekeeper') return;
      this.loadResidents(user.societyId);
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  loadResidents(societyId: string) {
    if (!societyId) return;
    this.dataService.getResidentsBySociety(societyId).subscribe(res => {
      this.allResidents = res;
    });
  }

  onResidentChange(residentId: string) {
    const found = this.allResidents.find(r => String(r.id) === String(residentId));
    if (found) {
      this.selectedResident = found;
      this.visitor.flatNumber = found.flatNumber || '';
    } else {
      this.selectedResident = null;
    }
  }

  async checkPreApproval() {
    if (!this.visitor.mobile) return;
    const user = this.authService.currentUser$.value;
    if (!user) return;

    try {
      const guest = await this.dataService.checkPreApproved(this.visitor.mobile, user.societyId);
      if (guest) {
        this.visitor.visitorName = guest.visitorName;
        this.isPreApproved = true;

        // Auto-select resident if they exist
        const resident = this.allResidents.find(r => r.id === guest.residentId);
        if (resident) {
          this.visitor.residentId = resident.id;
          this.onResidentChange(resident.id);
        } else if ((guest as any).flatNumber) {
          const found = this.allResidents.find(r => r.flatNumber === (guest as any).flatNumber);
          if (found) {
            this.visitor.residentId = found.id;
            this.onResidentChange(found.id);
          }
        }

        this.visitor.purpose = 'Pre-Approved Guest';
      }
    } catch (e) {
      console.error('Pre-approval check failed', e);
    }
  }


  isValid() {
    return this.visitor.visitorName && this.visitor.mobile && this.selectedResident;
  }

  async capturePhoto() {
    try {
      const photo = await this.cameraService.takePhoto();
      if (photo) {
        this.visitor.photoURL = photo;
      }
    } catch (error) {
      console.error('Camera error', error);
    }
  }


  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color });
    await toast.present();
  }

  async onSubmit() {
    // ALERT for debugging click triggers directly on device screen.
    // Replace alert with explicit validation to capture crashes.
    try {
      if (!this.visitor.mobile || String(this.visitor.mobile).trim() === '') {
        await this.showToast('Please enter Visitor Mobile Number');
        return;
      }

      if (!this.visitor.visitorName || String(this.visitor.visitorName).trim() === '') {
        await this.showToast('Please enter Visitor Name');
        return;
      }

      if (!this.selectedResident) {
        await this.showToast('Please select a Resident / Flat to visit');
        return;
      }

      const user = this.authService.currentUser$.value;
      if (!user) throw new Error('User not found');

      await this.dataService.addVisitor({
        ...this.visitor,
        gatekeeperId: user.id,
        societyId: user.societyId,
        residentId: this.selectedResident.id,
        status: this.isPreApproved ? 'checked-in' : 'pending',
        checkInTime: this.isPreApproved ? new Date() : null,
        checkOutTime: null
      });

      this.showSuccessPopup = true;

    } catch (error: any) {
      // Safe loader dismiss if present
      try { await this.loadingCtrl.dismiss(); } catch (e) { }

      const serverMessage =
        error?.error?.error ||
        error?.error?.message ||
        error?.message ||
        'Request failed';
      await this.showToast(serverMessage, 'danger');
    }
  }

  closeSuccessPopup() {
    this.showSuccessPopup = false;
    this.ngZone.run(() => {
      try { this.modalCtrl.dismiss(); } catch (e) { }
      this.navCtrl.navigateRoot('/gatekeeper', { animated: true, animationDirection: 'back' });
    });
  }
}
