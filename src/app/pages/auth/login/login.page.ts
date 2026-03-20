import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonInput, IonItem, IonList, IonicModule, LoadingController, ToastController } from '@ionic/angular';

import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { CommonSelectComponent } from '../../../components/common-select/common-select.component';

type UserRole = 'admin' | 'resident' | 'gatekeeper';

@Component({
  selector: 'app-login',
  template: `
  <ion-content [fullscreen]="true" class="[--background:#f8fafc]">
  <div class="relative min-h-[100svh] overflow-x-hidden bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_38%,#f8fafc_100%)]">
    
    <!-- Server Status Indicator -->
    <div class="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div class="px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-sm transition-all flex items-center gap-2"
           [ngClass]="{
             'bg-yellow-100/80 text-yellow-700 border border-yellow-200': serverStatus === 'checking',
             'bg-emerald-100/80 text-emerald-700 border border-emerald-200': serverStatus === 'online',
             'bg-rose-100/80 text-rose-700 border border-rose-200': serverStatus === 'offline'
           }">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                [ngClass]="{
                  'bg-yellow-400': serverStatus === 'checking',
                  'bg-emerald-400': serverStatus === 'online',
                  'bg-rose-400': serverStatus === 'offline'
                }"></span>
          <span class="relative inline-flex rounded-full h-2 w-2"
                [ngClass]="{
                  'bg-yellow-500': serverStatus === 'checking',
                  'bg-emerald-500': serverStatus === 'online',
                  'bg-rose-500': serverStatus === 'offline'
                }"></span>
        </span>
        <span *ngIf="serverStatus === 'checking'">Checking Server...</span>
        <span *ngIf="serverStatus === 'online'">Server is Online</span>
        <span *ngIf="serverStatus === 'offline'">Server lies Offline</span>
      </div>
    </div>
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[46vh] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.30),transparent_42%),radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_38%)]">
    </div>
    <div class="pointer-events-none absolute -right-14 top-10 h-36 w-36 rounded-full bg-indigo-400/20 blur-3xl"></div>
    <div class="pointer-events-none absolute -left-10 top-24 h-28 w-28 rounded-full bg-sky-300/20 blur-3xl"></div>

    <div class="relative z-10 flex min-h-[100svh] flex-col px-5 pb-6 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div class="pt-8 text-center">
        <div
          class="mx-auto mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-[32px] bg-white/85 shadow-[0_18px_40px_rgba(99,102,241,0.16)] ring-1 ring-white/80 backdrop-blur">
          <ion-icon name="shield-checkmark" color="primary" class="text-[46px]"></ion-icon>
        </div>
        <h1 class="m-0 text-[36px] font-extrabold tracking-[-1.2px] text-slate-900">MyHabitat</h1>
        <p class="mx-auto mt-3 max-w-[18rem] text-[15px] leading-6 text-slate-500">Secure visitor access designed for
          quick mobile check-ins and approvals.</p>
      </div>

      <div class="mt-4">
        <ion-card
          class="m-0 rounded-t-[34px] rounded-b-[28px] border border-white/60 bg-white/92 py-2 shadow-[0_-12px_40px_rgba(15,23,42,0.04),0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <ion-card-content class="px-4 pb-4 pt-3">
            <div
              class="mb-4  items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500"
              *ngIf="!otpSent">
              Secure Login
            </div>

            <div class="mb-5 text-left" *ngIf="!otpSent">
              <ion-label class="mb-2 ml-1 block text-[13px] font-semibold text-slate-500">Mobile Number</ion-label>
              <ion-list>
                <app-common-input
                  lines="none"
                  iconName="call-outline"
                  type="text"
                  placeholder="7041066102"
                  [(ngModel)]="mobileNumber">
                </app-common-input>
              </ion-list>
            </div>

            <div class="mb-5 text-left" *ngIf="!otpSent">
              <ion-label class="mb-2 ml-1 block text-[13px] font-semibold text-slate-500">Role</ion-label>
              <app-common-select
                lines="none"
                iconName="people-outline"
                [options]="[
                  { label: 'Gatekeeper', value: 'gatekeeper' },
                  { label: 'Resident', value: 'resident' },
                  { label: 'Admin', value: 'admin' }
                ]"
                [(ngModel)]="role">
              </app-common-select>
            </div>

            <div class="mt-5 border-t border-dashed border-slate-200 pt-5 text-left" *ngIf="otpSent">
              <div
                class="mb-4 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                OTP Verification
              </div>
              <ion-label class="mb-2 ml-1 block text-[13px] font-semibold text-slate-500">Enter OTP</ion-label>
              <app-common-input
                lines="none"
                iconName="keypad-outline"
                type="tel"
                placeholder="123456"
                [maxlength]="6"
                [(ngModel)]="otp">
              </app-common-input>
            </div>

            <ion-button *ngIf="!otpSent" expand="block" (click)="onSendOtp()" [disabled]="!mobileNumber || isSendingOtp"
              class="mt-5 h-[54px] font-bold [--background:linear-gradient(135deg,#8b92ea_0%,#a5a7ef_100%)] [--border-radius:20px] [--box-shadow:0_16px_30px_-14px_rgba(99,102,241,0.5)]">
              {{ isSendingOtp ? 'Sending OTP...' : 'Send OTP' }}
            </ion-button>

            <ion-button *ngIf="otpSent" expand="block" (click)="onVerifyOtp()" [disabled]="otp.length !== 6 || isVerifyingOtp"
              class="mt-5 h-[54px] font-bold [--background:linear-gradient(135deg,#10b981_0%,#34d399_100%)] [--border-radius:20px] [--box-shadow:0_16px_30px_-14px_rgba(16,185,129,0.5)]">
              {{ isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP' }}
            </ion-button>

            <div id="recaptcha-container" class="mt-4"></div>
          </ion-card-content>
        </ion-card>

        <p class="mt-4 text-center text-[12px] text-slate-400">Use your registered number and role to continue.</p>
      </div>
    </div>
  </div>
</ion-content>

`,
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, CommonInputComponent, CommonSelectComponent]


})
export class LoginPage {
  serverStatus: 'checking' | 'online' | 'offline' = 'checking';

  @ViewChild('mobileInput', { read: IonInput }) private mobileInput?: IonInput;
  @ViewChild('otpInput', { read: IonInput }) private otpInput?: IonInput;

  mobileNumber = '9000000002';
  otp = '123456';
  otpSent = false;
  role: UserRole = 'gatekeeper';
  isSendingOtp = false;
  isVerifyingOtp = false;

  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  ngOnInit() {
    this.checkServerStatus();
  }

  checkServerStatus() {
    this.serverStatus = 'checking';
    this.apiService.getUsers().subscribe({
      next: (res) => {
        if (res && Array.isArray(res)) {
          this.serverStatus = 'online';
        } else {
          this.serverStatus = 'offline';
        }
      },
      error: () => {
        this.serverStatus = 'offline';
      }
    });
  }






  ionViewLoaded() {
    setTimeout(() => {
      this.mobileInput?.setFocus();
    }, 500);
  }
  async onSendOtp() {
    if (this.serverStatus === 'offline') {
      this.showToast('⚠️ Cannot connect to your local backend. Are you using 10.0.2.2 for the Android Emulator?', 6000);
      return;
    }

    if (this.isSendingOtp) return;
    this.isSendingOtp = true;

    try {
      const response = await this.authService.sendOtp(this.mobileNumber, this.role, 'recaptcha-container');

      if (response.success) {
        this.otpSent = true;
        this.showToast('OTP sent successfully!');
        setTimeout(() => this.otpInput?.setFocus(), 120);
      } else {
        this.showToast(response.message || 'Failed to send OTP.', 4000);
      }
    } catch (error) {
      console.error('[LoginPage] onSendOtp', error);
      this.showToast('Something went wrong. Please try again.', 5000);
    } finally {
      this.isSendingOtp = false;
    }
  }

  async onVerifyOtp() {
    if (this.otp.length !== 6) {
      return;
    }

    if (this.isVerifyingOtp) return;
    this.isVerifyingOtp = true;

    try {
      const response = await this.authService.verifyOtp(this.otp, this.role);

      if (!response.success) {
        this.showToast(response.message || 'Invalid OTP. Please try again.', 4000);
      }
    } catch (error) {
      console.error('[LoginPage] onVerifyOtp', error);
      this.showToast('Something went wrong verifying OTP.', 5000);
    } finally {
      this.isVerifyingOtp = false;
    }
  }

  private async showToast(message: string, duration = 3500) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'bottom',
      color: 'dark',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });

    await toast.present();
  }
}
