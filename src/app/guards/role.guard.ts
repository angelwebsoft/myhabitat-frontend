import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const expectedRole = route.data['role'];

    return authService.currentUser$.pipe(
        filter(user => user !== undefined),
        take(1),
        map(user => {
            if (user && user.role === expectedRole) {
                return true;
            }
            router.navigate(['/login']);
            return false;
        })
    );
};
