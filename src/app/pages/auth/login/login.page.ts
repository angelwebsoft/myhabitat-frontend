import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonInput, IonItem, IonList, IonicModule, LoadingController, ToastController, AlertController } from '@ionic/angular';

import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
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
  isSendingOtp = false;
  isVerifyingOtp = false;

  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private notificationService = inject(NotificationService);

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
      const response = await this.authService.sendOtp(this.mobileNumber, 'recaptcha-container');

      if (response.success) {
        this.otpSent = true;
        this.showToast('OTP sent successfully!');
        setTimeout(() => this.otpInput?.setFocus(), 120);
      } else {
        this.showErrorAlert('OTP Error', response.message || 'Failed to send OTP.');
      }
    } catch (error) {
      console.error('[LoginPage] onSendOtp', error);
      this.showErrorAlert('Connection Error', 'Something went wrong. Please check your internet connection.');
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
      const response = await this.authService.verifyOtp(this.otp);

      if (response.success) {
        this.showToast('Login successful!');
      } else {
        this.showErrorAlert('Login Failed', response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('[LoginPage] onVerifyOtp', error);
      this.showErrorAlert('System Error', 'An unexpected error occurred during verification.');
    } finally {
      this.isVerifyingOtp = false;
    }
  }

  private async showToast(message: string, duration = 3500) {
    this.notificationService.showToast(message, 'info', duration);
  }

  private async showErrorAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }
}
