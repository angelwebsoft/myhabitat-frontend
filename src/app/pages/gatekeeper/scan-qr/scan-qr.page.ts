import { Component, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController, NavController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data.service';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class ScanQrPage {
  @ViewChild('video', { static: false }) videoEl?: ElementRef<HTMLVideoElement>;

  token = '';
  isScanning = false;
  canLiveScan = !!navigator.mediaDevices?.getUserMedia;
  isSecureContext = typeof window !== 'undefined' ? (window as any).isSecureContext === true : false;

  private stream?: MediaStream;
  private rafId?: number;
  private isConsuming = false;

  private authService = inject(AuthService);
  private dataService = inject(DataService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private navCtrl = inject(NavController);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  ionViewWillEnter() {
    // Auto-start live scan so the flow is "open page -> scan -> done".
    if (this.canLiveScan && this.isSecureContext) {
      this.startLiveScan().catch(err => console.error(err));
    }
  }

  ionViewWillLeave() {
    this.stopScan();
  }

  async startLiveScan() {
    if (this.isScanning) return;
    if (!navigator.mediaDevices?.getUserMedia || !this.isSecureContext) {
      await this.showToast('Live scan needs HTTPS (or installed app). Use camera capture instead.', 'medium');
      return;
    }

    this.isScanning = true;
    this.token = '';
    this.isConsuming = false;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const video = this.videoEl?.nativeElement;
      if (!video) return;
      video.srcObject = this.stream;

      // Ensure metadata is ready before scanning frames.
      await new Promise<void>(resolve => {
        const v = this.videoEl?.nativeElement;
        if (!v) return resolve();
        if (v.readyState >= 2) return resolve();
        v.onloadedmetadata = () => resolve();
      });

      this.scanFrame();
    } catch (e) {
      this.isScanning = false;
      await this.showToast('Camera permission denied or unavailable', 'danger');
    }
  }

  stopScan() {
    this.isScanning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = undefined;
    }
  }

  private scanFrame() {
    if (!this.isScanning) return;
    const video = this.videoEl?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      this.rafId = requestAnimationFrame(() => this.scanFrame());
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.rafId = requestAnimationFrame(() => this.scanFrame());
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      const raw = result?.data ? String(result.data) : '';

      if (raw && !this.isConsuming) {
        this.isConsuming = true;
        this.token = raw;
        this.consumeToken().catch(err => console.error(err));
        return;
      }
    } catch {
      // ignore frame errors
    }

    this.rafId = requestAnimationFrame(() => this.scanFrame());
  }

  private async consumeToken() {
    const gatekeeper = this.authService.currentUser$.value;
    if (!gatekeeper) return;

    const value = this.token.trim();
    if (!value) return;

    const loading = await this.loadingCtrl.create({ message: 'Approving...' });
    await loading.present();

    try {
      this.stopScan();
      await this.dataService.consumePreApprovedByQr(value, gatekeeper.id);
      await loading.dismiss();
      await this.showToast('Guest approved and checked-in', 'success');
      this.ngZone.run(() => {
        this.navCtrl.navigateRoot('/gatekeeper', { animated: true, animationDirection: 'back' });
      });
    } catch (e: any) {
      await loading.dismiss();
      this.isConsuming = false;
      await this.showToast(e?.error?.error || e?.message || 'Invalid QR or already used', 'danger');
      // Restart scan for next attempt.
      await this.startLiveScan();
    }
  }

  async scanWithNativeCamera() {
    const gatekeeper = this.authService.currentUser$.value;
    if (!gatekeeper) return;

    const loading = await this.loadingCtrl.create({ message: 'Opening camera...' });
    await loading.present();

    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      const dataUrl = photo.dataUrl;
      if (!dataUrl) {
        throw new Error('No image captured');
      }

      const token = await this.decodeQrFromDataUrl(dataUrl);
      if (!token) {
        throw new Error('QR not detected. Try again with better lighting.');
      }

      this.token = token;
      await loading.dismiss();
      await this.consumeToken();
    } catch (e: any) {
      await loading.dismiss();
      await this.showToast(e?.message || 'Failed to scan QR', 'danger');
    }
  }

  private async decodeQrFromDataUrl(dataUrl: string): Promise<string | null> {
    const image = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);
    return result?.data ? String(result.data) : null;
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Invalid image'));
      image.src = dataUrl;
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'medium') {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color });
    toast.present();
  }
}
