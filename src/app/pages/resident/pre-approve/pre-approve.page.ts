import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as QRCode from 'qrcode';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { CommonDateComponent } from '../../../components/common-date/common-date.component';

@Component({
  selector: 'app-pre-approve',
  templateUrl: './pre-approve.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, CommonInputComponent, CommonDateComponent]
})
export class PreApprovePage {
  guest = {
    visitorName: '',
    mobile: '',
    vehicleNumber: '',
    validDate: new Date().toISOString(),
  };

  qrToken = '';
  qrDataUrl: SafeUrl | null = null;
  isQrModalOpen = false;

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  isValid() {
    return this.guest.visitorName && this.guest.mobile;
  }

  async onSubmit() {
    if (!this.isValid()) return;

    const loading = await this.loadingCtrl.create({
      message: 'Generating Pass...',
      spinner: 'crescent',
      cssClass: 'custom-loading'
    });
    await loading.present();

    try {
      const user = this.authService.currentUser$.value;
      if (!user) throw new Error('User context not found. Please log in again.');

      const created = await this.dataService.addPreApprovedGuest({
        visitorName: this.guest.visitorName,
        mobile: this.guest.mobile,
        vehicleNumber: this.guest.vehicleNumber.trim() || undefined,
        validDate: new Date(this.guest.validDate),
        residentId: user.id,
        societyId: user.societyId
      });

      this.qrToken = created.qrToken || '';
      if (!this.qrToken) throw new Error('Security token generation failed.');

      const qrUrl = await this.generateQrDataUrl(this.qrToken);
      this.qrDataUrl = this.sanitizer.bypassSecurityTrustUrl(qrUrl);

      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: 'Pass Created Successfully',
        duration: 2000,
        position: 'top',
        color: 'success',
        cssClass: 'custom-toast'
      });
      toast.present();
    } catch (error: any) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: error.message,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      toast.present();
    }
  }

  onDone() {
    this.router.navigate(['/resident']);
  }

  openQr() {
    if (!this.qrDataUrl) return;
    this.isQrModalOpen = true;
  }

  closeQr() {
    this.isQrModalOpen = false;
  }

  private async generateQrDataUrl(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="white"/><text x="20" y="50" font-size="20" font-weight="bold" fill="#0f172a">Token: ${text}</text></svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
  }
}
