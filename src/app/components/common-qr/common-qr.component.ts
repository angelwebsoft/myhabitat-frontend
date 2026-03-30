import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as QRCode from 'qrcode';

@Component({
    selector: 'app-common-qr',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="qr-container" (click)="onQrClick($event)">
      <img *ngIf="qrDataUrl" [src]="qrDataUrl" [style.width]="size + 'px'" [style.height]="size + 'px'" class="qr-image" />
      <div *ngIf="!qrDataUrl" class="qr-placeholder flex items-center justify-center bg-slate-100 rounded-lg" [style.width]="size + 'px'" [style.height]="size + 'px'">
         <div class="animate-pulse w-1/2 h-1/2 bg-slate-200 rounded"></div>
      </div>
    </div>
  `,
    styles: [`
    .qr-container {
      display: inline-flex;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .qr-container:active {
      transform: scale(0.92);
    }
    .qr-image {
      border-radius: 8px;
    }
  `]
})
export class CommonQrComponent implements OnInit, OnChanges {
    @Input() value: string = '';
    @Input() size: number = 52;
    @Output() qrClick = new EventEmitter<string>();

    qrDataUrl: SafeUrl | null = null;
    private sanitizer = inject(DomSanitizer);

    ngOnInit() {
        this.generateQr();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value'] || changes['size']) {
            this.generateQr();
        }
    }

    onQrClick(event: Event) {
        event.stopPropagation();
        this.qrClick.emit(this.value);
    }

    private async generateQr() {
        if (!this.value) return;
        try {
            const url = await QRCode.toDataURL(this.value, {
                width: this.size * 2, // Double for retina
                margin: 1,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                }
            });
            this.qrDataUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        } catch (e) {
            console.error('QR Generate Error:', e);
        }
    }
}
