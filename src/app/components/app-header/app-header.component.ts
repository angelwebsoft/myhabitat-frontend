import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IonicModule, MenuController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styles: [`
    ion-toolbar {
      --border-style: none;
    }
    ion-title {
      --padding-start: 4px;
      font-weight: 700;
      font-size: 1.15rem;
    }
    ion-menu-button {
      --padding-start: 0;
      --padding-end: 0;
      --padding-top: 0;
      --padding-bottom: 0;
      width: 38px;
      height: 38px;
    }
    ion-menu-button::part(native) {
      width: 38px;
      height: 38px;
      background: #ffffff !important;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    ion-menu-button::part(icon) {
      font-size: 20px;
      color: #000000 !important;
    }
    ion-back-button {
      --padding-start: 0;
      --padding-end: 0;
      margin-left: 8px;
      width: 36px;
      height: 36px;
    }
    ion-back-button::part(native) {
      background: #ffffff !important;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      min-width: 0;
      padding: 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    ion-back-button::part(icon) {
      font-size: 18px;
      color: #000000 !important;
    }
  `],
  template: `
    <header class="ion-no-border p-4" style="background: var(--ion-color-primary);">
      <div [style.padding-top]="'calc(env(safe-area-inset-top, 0px) + 8px)'" class="flex items-center justify-between px-4 pb-2">
        <ion-buttons *ngIf="showBack" slot="start" class="ml-0 absolute left-3 z-[20]">
            <ion-icon (click)="goBack()" name="arrow-back-outline" class="text-2xl text-white"></ion-icon>
        </ion-buttons>

        <ion-title class="ml-1 text-center absolute w-full left-0 right-0 text-white" [ngClass]="{ 'pl-0': !showBack }" [color]="titleColor">{{ title }}</ion-title>

        <ion-buttons class="absolute right-3 z-[20]" *ngIf="showMenuButton" slot="end">
          <ion-menu-toggle menu="main-menu" class="mt-1 p-0">
              <ion-icon name="menu-outline" class="text-3xl text-white"></ion-icon>
          </ion-menu-toggle>
        </ion-buttons>
      </div>
    </header>
  `
})
export class AppHeaderComponent {
  private menuCtrl = inject(MenuController);
  private navCtrl = inject(NavController);

  @Input() title = '';
  @Input() color: string = 'primary';
  @Input() titleColor?: string;

  @Input() paddingX = 16;

  @Input() showBack = false;
  @Input() defaultHref = '/';
  @Input() backButtonColor?: string;

  @Input() showMenuButton = true;
  @Input() menuButtonColor?: string;

  @Input() showLogout = false;
  @Input() actionColor?: string;
  @Output() logout = new EventEmitter<void>();

  goBack() {
    this.navCtrl.back();
  }

  get effectiveActionColor(): string {
    if (this.actionColor) return this.actionColor;
    if (this.backButtonColor) return this.backButtonColor;
    if (this.titleColor) return this.titleColor;
    if (this.color === 'warning' || this.color === 'light') return 'dark';
    return 'light';
  }

  openMainMenu() {
    this.menuCtrl.open('main-menu');
  }
}
