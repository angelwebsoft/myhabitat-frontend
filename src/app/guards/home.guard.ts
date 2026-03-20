import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter } from 'rxjs/operators';

export const homeGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        filter(user => user !== undefined),
        take(1),
        map(user => {
            if (user) {
                if (user.role === 'gatekeeper') {
                    return router.parseUrl('/gatekeeper');
                } else if (user.role === 'admin') {
                    return router.parseUrl('/admin');
                } else {
                    return router.parseUrl('/resident');
                }
            }
            return router.parseUrl('/login');
        })
    );
};
