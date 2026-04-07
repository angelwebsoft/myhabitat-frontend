import { AsyncPipe, NgIf, NgClass } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { IonApp, IonAvatar, IonButton, IonContent, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonRouterOutlet, IonSpinner } from '@ionic/angular/standalone';
import { distinctUntilChanged, map, filter, combineLatest, BehaviorSubject } from 'rxjs';
import { AuthService } from './services/auth.service';
import { PushNotificationsService } from './services/push-notifications.service';
import { NotificationService } from './services/notification.service';
import { StatusBar } from '@capacitor/status-bar';
type UserRole = 'admin' | 'resident' | 'gatekeeper';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    NgClass,
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
    IonRouterOutlet,
    IonSpinner
  ],
})

export class AppComponent {
  public authService = inject(AuthService);
  private menuCtrl = inject(MenuController);
  private platform = inject(Platform);
  private push = inject(PushNotificationsService);
  private destroyRef = inject(DestroyRef);
  private notificationService = inject(NotificationService);
  router = inject(Router);

  toast$ = this.notificationService.toast$;
  currentUser$ = this.authService.currentUser$.asObservable();
  isNative = this.platform.is('hybrid') || this.platform.is('capacitor') || this.platform.is('cordova');

  showSplash = true;

  ngOnInit() {
    StatusBar.setOverlaysWebView({ overlay: false });

    const minTimePassed$ = new BehaviorSubject<boolean>(false);
    setTimeout(() => minTimePassed$.next(true), 3500); // 3.5 seconds minimum delay

    combineLatest([
      this.authService.loading$,
      minTimePassed$
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([loading, minTimePassed]) => {
      this.showSplash = loading || !minTimePassed;
    });
  }


  setTheme(role: string) {
    const themes = ['admin-theme', 'gatekeeper-theme', 'resident-theme', 'login-theme'];
    themes.forEach(thm => {
      document.body.classList.remove(thm);
      document.documentElement.classList.remove(thm);
    });

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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((user) => {
        if (user) {
          this.setTheme(user.role);
          void this.push.init(user);
        } else {
          this.setTheme(''); // Clearing theme layouts if logged out
        }
      });

    // Reset scroll to top on every navigation
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      const contents = document.querySelectorAll('ion-content');
      contents.forEach(c => (c as any).scrollToTop?.(0));
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
