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
  templateUrl: './login.page.html',
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

  ionViewWillEnter() {
    this.applyLoginTheme();
  }

  clearThemes() {
    const themes = ['admin-theme', 'gatekeeper-theme', 'resident-theme', 'login-theme'];
    themes.forEach(thm => {
      document.body.classList.remove(thm);
      document.documentElement.classList.remove(thm);
    });
  }

  applyLoginTheme() {
    this.clearThemes();
    document.body.classList.add('login-theme');
    document.documentElement.classList.add('login-theme');
  }

  setTheme(role: UserRole) {
    // This is no longer used for live theme switching in select
    // but kept for compatibility if needed elsewhere
    this.applyLoginTheme();
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

      if (response.success) {
        localStorage.setItem('userRole', this.role);

        this.showToast('Login successful!');

        // optional navigation
        // this.router.navigate(['/dashboard']);

      } else {
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
