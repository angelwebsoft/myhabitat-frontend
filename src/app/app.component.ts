import { AsyncPipe, NgIf } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { IonApp, IonAvatar, IonButton, IonContent, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonRouterOutlet } from '@ionic/angular/standalone';
import { distinctUntilChanged, map } from 'rxjs';
import { AuthService } from './services/auth.service';
import { PushNotificationsService } from './services/push-notifications.service';
import { StatusBar } from '@capacitor/status-bar';
type UserRole = 'admin' | 'resident' | 'gatekeeper';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    IonApp,
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuToggle,
    IonRouterOutlet
  ],
})

export class AppComponent {
  private authService = inject(AuthService);
  private menuCtrl = inject(MenuController);
  private platform = inject(Platform);
  private push = inject(PushNotificationsService);
  private destroyRef = inject(DestroyRef);
  router = inject(Router);

  currentUser$ = this.authService.currentUser$.asObservable();
  isNative = this.platform.is('hybrid') || this.platform.is('capacitor') || this.platform.is('cordova');
  ngOnInit() {
    // Left empty or can load other static init things if needed
    StatusBar.setOverlaysWebView({ overlay: false });
  }


  setTheme(role: string) {
    const themes = ['admin-theme', 'gatekeeper-theme', 'resident-theme'];
    document.body.classList.remove(...themes);
    document.documentElement.classList.remove(...themes);

    if (role === 'admin') {
      document.body.classList.add('admin-theme');
      document.documentElement.classList.add('admin-theme');
    } else if (role === 'gatekeeper') {
      document.body.classList.add('gatekeeper-theme');
      document.documentElement.classList.add('gatekeeper-theme');
    } else if (role === 'resident') {
      document.body.classList.add('resident-theme');
      document.documentElement.classList.add('resident-theme');
    }
  }

  constructor() {
    this.authService.currentUser$
      .pipe(
        map((user) => !!user),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((isLoggedIn) => {
        void this.menuCtrl.enable(isLoggedIn, 'main-menu');
        if (!isLoggedIn) {
          void this.menuCtrl.close('main-menu');
        }
      });

    this.authService.currentUser$
      .pipe(
        distinctUntilChanged((a, b) => (a?.id ?? null) === (b?.id ?? null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((user) => {
        if (user) {
          this.setTheme(user.role);
          void this.push.initForWeb(user);
        } else {
          this.setTheme(''); // Clearing theme layouts if logged out
        }
      });
  }

  goDashboard() {
    const user = this.authService.currentUser$.value;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    if (user.role === 'admin') this.router.navigate(['/admin']);
    else if (user.role === 'gatekeeper') this.router.navigate(['/gatekeeper']);
    else this.router.navigate(['/resident']);
  }

  async logout() {
    try {
      await this.menuCtrl.close('main-menu');
      await this.menuCtrl.enable(false, 'main-menu');
    } finally {
      await this.authService.logout();
    }
  }
}
