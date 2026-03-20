declare module 'jsqr' {
  export interface JsQRPoint {
    x: number;
    y: number;
  }

  export interface JsQRLocation {
    topLeftCorner: JsQRPoint;
    topRightCorner: JsQRPoint;
    bottomLeftCorner: JsQRPoint;
    bottomRightCorner: JsQRPoint;
  }

  export interface JsQRResult {
    data: string;
    location: JsQRLocation;
  }

  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: any
  ): JsQRResult | null;
}

