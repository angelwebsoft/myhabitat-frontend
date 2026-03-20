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

@Component({
  selector: 'app-pre-approve',
  template: `
    <app-header title="Pre-Approve Guest" color="tertiary" [showBack]="true" defaultHref="/resident"></app-header>

    <ion-content class="ion-padding">
      <div *ngIf="qrDataUrl" class="mb-5 rounded-2xl bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        <h2 class="m-0 text-[16px] font-bold text-slate-800">Guest QR</h2>
        <p class="mt-1 text-[13px] text-slate-500">Ask the guest to show this QR to the gatekeeper.</p>

        <div class="mt-4 flex items-center gap-4">
          <button type="button" class="shrink-0 rounded-xl border border-slate-200 bg-white p-2" (click)="openQr()">
            <img [src]="qrDataUrl" alt="Guest QR" class="h-[110px] w-[110px]" />
          </button>
          <div class="min-w-0">
            <p class="m-0 truncate text-[14px] font-bold text-slate-800">{{ guest.visitorName }}</p>
            <p class="mt-1 truncate text-[13px] text-slate-500">{{ guest.mobile }}</p>
            <p class="mt-1 truncate text-[13px] text-slate-500">{{ guest.validDate | date:'mediumDate' }}</p>
            <p class="mt-1 truncate text-[12px] text-slate-400">Token: {{ qrToken }}</p>
            <ion-button size="small" class="mt-2" color="tertiary" (click)="openQr()">
              View Large QR
            </ion-button>
          </div>
        </div>

        <ion-button expand="block" class="mt-4" color="tertiary" (click)="onDone()">
          Done
        </ion-button>
      </div>

      <ion-item>
        <ion-label position="stacked">Guest Name</ion-label>
        <ion-input [(ngModel)]="guest.visitorName"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Mobile Number</ion-label>
        <ion-input type="tel" [(ngModel)]="guest.mobile"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Visit Date</ion-label>
        <ion-datetime-button slot="end" datetime="visitDate"></ion-datetime-button>
      </ion-item>
      <ion-modal [keepContentsMounted]="true">
        <ng-template>
          <ion-datetime
            id="visitDate"
            presentation="date"
            [(ngModel)]="guest.validDate"
            [showDefaultButtons]="true"
            cancelText="Close"
            doneText="Done"
          ></ion-datetime>
        </ng-template>
      </ion-modal>

      <ion-button expand="block" color="tertiary" (click)="onSubmit()" [disabled]="!isValid()" class="ion-margin-top">
        Generate Pre-Approval
      </ion-button>

      <ion-modal [isOpen]="isQrModalOpen" (didDismiss)="closeQr()">
        <ng-template>
          <ion-header class="ion-no-border">
            <ion-toolbar color="tertiary">
              <ion-title>Guest QR</ion-title>
              <ion-buttons slot="end">
                <ion-button fill="clear" size="small" aria-label="Close" (click)="closeQr()">
                  <ion-icon name="close" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding" color="light">
            <div class="rounded-2xl bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
              <p class="m-0 text-[14px] font-bold text-slate-800">{{ guest.visitorName }}</p>
              <p class="mt-1 text-[13px] text-slate-500">{{ guest.mobile }} • {{ guest.validDate | date:'mediumDate' }}</p>
              <div class="mt-4 flex items-center justify-center">
                <img [src]="qrDataUrl" alt="Guest QR Large" class="h-[320px] w-[320px] rounded-2xl border border-slate-200 bg-white p-3" />
              </div>
              <ion-item lines="none" class="mt-4 [--background:#f4f5f8] [--border-radius:12px]">
                <ion-label class="text-[12px] text-slate-500">Token</ion-label>
                <ion-note slot="end" class="select-all text-[12px]">{{ qrToken }}</ion-note>
              </ion-item>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class PreApprovePage {
  guest = {
    visitorName: '',
    mobile: '',
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
    const loading = await this.loadingCtrl.create({ message: 'Creating...' });
    await loading.present();

    try {
      const user = this.authService.currentUser$.value;
      if (!user) throw new Error('User not found');

      const created = await this.dataService.addPreApprovedGuest({
        visitorName: this.guest.visitorName,
        mobile: this.guest.mobile,
        validDate: new Date(this.guest.validDate),
        residentId: user.id,
        societyId: user.societyId
      });

      await loading.dismiss();
      this.qrToken = created.qrToken || '';
      if (!this.qrToken) {
        throw new Error('QR token was not generated');
      }

      const qrUrl = await this.generateQrDataUrl(this.qrToken);
      this.qrDataUrl = this.sanitizer.bypassSecurityTrustUrl(qrUrl);

      const toast = await this.toastCtrl.create({
        message: 'Pre-approval created. Share the QR with the guest.',
        duration: 3000,
        color: 'success'
      });
      toast.present();
    } catch (error: any) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({ message: error.message, duration: 3000, color: 'danger' });
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
      return await QRCode.toDataURL(text, { width: 260, margin: 1 });
    } catch {
      // Simple fallback so the flow still works even if QR lib isn't installed yet.
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><rect width="100%" height="100%" fill="white"/><text x="12" y="36" font-size="14" fill="black">QR Token:</text><text x="12" y="60" font-size="12" fill="black">${text}</text></svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
  }
}
