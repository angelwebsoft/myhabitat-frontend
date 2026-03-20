import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({
    providedIn: 'root'
})
export class CameraService {
    private readonly maxWidth = 960;
    private readonly maxHeight = 960;
    private readonly outputQuality = 0.72;

    async takePhoto() {
        const image = await Camera.getPhoto({
            quality: 65,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera
        });

        if (!image.dataUrl) {
            return null;
        }

        return this.compressDataUrl(image.dataUrl);
    }

    private async compressDataUrl(dataUrl: string): Promise<string> {
        const image = await this.loadImage(dataUrl);
        const { width, height } = this.getOutputDimensions(image.naturalWidth || image.width, image.naturalHeight || image.height);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
            return dataUrl;
        }

        context.drawImage(image, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', this.outputQuality);
        return compressedDataUrl.length < dataUrl.length ? compressedDataUrl : dataUrl;
    }

    private loadImage(dataUrl: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Failed to process captured image'));
            image.src = dataUrl;
        });
    }

    private getOutputDimensions(width: number, height: number) {
        const scale = Math.min(this.maxWidth / width, this.maxHeight / height, 1);

        return {
            width: Math.max(1, Math.round(width * scale)),
            height: Math.max(1, Math.round(height * scale))
        };
    }
}
