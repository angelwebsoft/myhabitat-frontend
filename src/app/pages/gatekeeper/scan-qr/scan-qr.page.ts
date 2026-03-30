import { Component, ElementRef, ViewChild, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data.service';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule],

  styles: [`
    .scanner-laser {
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      animation: scan-loop 2.5s ease-in-out infinite;
    }
    @keyframes scan-loop {
      0% { top: 0%; opacity: 0; }
      10% { opacity: 1; }
      50% { top: 100%; }
      90% { opacity: 1; }
      100% { top: 0%; opacity: 0; }
    }
  `]
})
export class ScanQrPage implements OnDestroy {
  @ViewChild('video', { static: false }) videoElement?: ElementRef<HTMLVideoElement>;

  isScanning = false;
  scannedResult = '';
  scanError = '';
  private stream?: MediaStream;
  private rafId?: number;
  private isProcessing = false;

  private authService = inject(AuthService);
  private dataService = inject(DataService);
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  ionViewDidEnter() {
    this.startScanner();
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  goBack() {
    this.stopScanner();
    this.navCtrl.back();
  }

  async openGallery() {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 90
      });

      if (photo.dataUrl) {
        this.isProcessing = true;
        this.stopScanner();

        const code = await this.decodeQrImage(photo.dataUrl);
        if (code) {
          this.scannedResult = code;
          this.processQr(code);
        } else {
          this.isProcessing = false;
          const toast = await this.toastCtrl.create({
            message: 'No readable QR code found in selected image',
            duration: 3000,
            color: 'warning'
          });
          await toast.present();
          this.startScanner();
        }
      }
    } catch (e) {
      // User cancelled picker
    }
  }

  private decodeQrImage(dataUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(result?.data || null);
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async startScanner() {
    this.scannedResult = '';
    this.isProcessing = false;

    try {
      // PROMPT NATIVE PERMISSIONS FIRST
      // This is required because Android webviews will often silently hang on getUserMedia
      // if the native permission hasn't already been explicitly granted to the app shell.
      const permission = await Camera.requestPermissions({ permissions: ['camera'] });

      if (permission.camera === 'denied' || permission.camera === 'prompt-with-rationale') {
        alert('Native Camera permission was denied. Please allow camera access in App Settings.');
        return;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const video = this.videoElement?.nativeElement;
      if (!video) return;

      video.srcObject = this.stream;
      // Wait for video to parse hardware stream
      video.onloadedmetadata = () => {
        video.play();
        this.isScanning = true;
        this.scanFrame(); // start the jsQR loop
      };
    } catch (err) {
      console.error('Error starting camera:', err);
      alert('Camera error: ' + String(err));
    }
  }

  stopScanner() {
    this.isScanning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = undefined;
    }
  }

  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private lastScanTime = 0;
  private SCAN_INTERVAL = 150; // ms

  private scanFrame() {
    if (!this.isScanning) return;

    const video = this.videoElement?.nativeElement;

    if (!video || video.videoWidth === 0) {
      this.rafId = requestAnimationFrame(() => this.scanFrame());
      return;
    }

    // Run outside Angular to avoid change detection lag
    this.ngZone.runOutsideAngular(() => {

      const now = performance.now();

      // ⛔ Limit scanning frequency
      if (now - this.lastScanTime < this.SCAN_INTERVAL) {
        this.rafId = requestAnimationFrame(() => this.scanFrame());
        return;
      }

      this.lastScanTime = now;

      // ✅ Create canvas ONLY ONCE
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
      }

      const scale = 0.5; // 🔥 Reduce resolution (BIG performance boost)

      this.canvas.width = video.videoWidth * scale;
      this.canvas.height = video.videoHeight * scale;

      this.ctx!.drawImage(
        video,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      const imageData = this.ctx!.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      const code = jsQR(
        imageData.data,
        imageData.width,
        imageData.height,
        { inversionAttempts: "dontInvert" }
      );

      if (code && code.data && !this.isProcessing) {
        this.isProcessing = true;

        // Back to Angular zone for UI updates
        this.ngZone.run(() => {
          this.processQr(code.data);
        });

        return;
      }

      this.rafId = requestAnimationFrame(() => this.scanFrame());
    });
  }

  private async processQr(token: string) {
    const gatekeeper = this.authService.currentUser$.value;
    if (!gatekeeper) return;

    try {
      const response = await this.dataService.consumePreApprovedByQr(token, gatekeeper.id);

      this.scannedResult = 'success';
      // Stop the hardware ONLY upon definitive check-in success
      this.stopScanner();

      setTimeout(() => {
        this.ngZone.run(() => {
          this.navCtrl.navigateRoot('/gatekeeper', {
            animated: true,
            animationDirection: 'back',
            state: { openVisitor: response.visitor }
          });
        });
      }, 1500);

    } catch (error: any) {
      console.error("❌ FAILED:", error);
      const errorMessage = error?.error?.error || error?.message || 'Invalid or Used Pass';
      this.scanError = errorMessage;

      // Show the red overlay and wait 2.5s before seamlessly scanning the very next code!
      setTimeout(() => {
        this.scanError = '';
        this.scannedResult = '';
        this.isProcessing = false;
        // Restart the jsQR loop using the still-active camera stream
        this.scanFrame();
      }, 2500);
    }
  }
}
