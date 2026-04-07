import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import {
    Auth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
    onAuthStateChanged,
    signOut,
    User as FirebaseUser
} from '@angular/fire/auth';

import { User } from '../models/visitor.model';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly ROLE_STORAGE_KEY = 'gp_logged_in_role';

    private router = inject(Router);
    private auth = inject(Auth);
    private apiService = inject(ApiService);

    currentUser$ = new BehaviorSubject<User | null | undefined>(undefined);
    loading$ = new BehaviorSubject<boolean>(true);

    private confirmationResult: ConfirmationResult | null = null;
    private recaptchaVerifier?: RecaptchaVerifier;

    constructor() {

        // Listen to Firebase Auth state
        onAuthStateChanged(this.auth, async (fbUser: FirebaseUser | null) => {

            if (fbUser) {
                await this.loadUserProfile(fbUser.phoneNumber || '');
            } else {
                this.currentUser$.next(null);
                this.loading$.next(false);
            }

        });

    }

    /**
     * Initialize Recaptcha
     */
    private async initRecaptcha(containerId: string): Promise<RecaptchaVerifier> {
        if (this.recaptchaVerifier) {
            return this.recaptchaVerifier;
        }

        this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
            size: 'invisible'
        });

        // Newer Firebase/Auth builds can require an explicit render before use.
        await this.recaptchaVerifier.render();

        return this.recaptchaVerifier;
    }

    /**
     * Send OTP
     */
    async sendOtp(
        mobile: string,
        recaptchaContainerId: string
    ): Promise<{ success: boolean; message?: string }> {

        try {

            const normalizedMobile = this.normalizeMobile(mobile);
            const matchedUser = await this.findUserByMobile(normalizedMobile);

            if (!matchedUser) {
                return {
                    success: false,
                    message: 'No registered user found with this mobile number'
                };
            }

            const recaptchaVerifier = await this.initRecaptcha(recaptchaContainerId);

            const formattedMobile =
                mobile.startsWith('+') ? mobile : `+91${mobile}`;

            this.confirmationResult =
                await signInWithPhoneNumber(
                    this.auth,
                    formattedMobile,
                    recaptchaVerifier
                );

            return { success: true };

        } catch (error: any) {

            console.error('[AuthService] Send OTP Error:', error);
            try {
                this.recaptchaVerifier?.clear();
            } catch { }
            this.recaptchaVerifier = undefined;

            return {
                success: false,
                message: error.message || 'Failed to send OTP'
            };

        }

    }

    /**
     * Verify OTP
     */
    async verifyOtp(
        otp: string
    ): Promise<{ success: boolean; message?: string }> {

        if (!this.confirmationResult) {

            return {
                success: false,
                message: 'OTP session expired. Please request again.'
            };

        }

        try {

            const result = await this.confirmationResult.confirm(otp);
            const fbUser = result.user;
            const normalizedMobile = this.normalizeMobile(fbUser.phoneNumber || '');
            const userData = await this.findUserByMobile(normalizedMobile);

            if (!userData) {
                await signOut(this.auth);
                this.currentUser$.next(null);
                return {
                    success: false,
                    message: 'User profile not found. Please contact admin.'
                };
            }

            this.storeRole(userData.role);
            this.currentUser$.next(userData);

            await this.redirectToDashboard(userData);

            return { success: true };

        } catch (error: any) {

            console.error('[AuthService] Verify OTP Error:', error);

            return {
                success: false,
                message: error.message || 'Invalid OTP'
            };

        }

    }

    /**
     * Load user profile from Firestore
     */
    private async loadUserProfile(phoneNumber: string) {

        try {

            const normalizedMobile = this.normalizeMobile(phoneNumber);
            const storedRole = this.getStoredRole();
            const userData = storedRole
                ? await this.findUserByMobileAndRole(normalizedMobile, storedRole)
                : await this.findUserByMobile(normalizedMobile);

            if (userData) {
                this.storeRole(userData.role);
                this.currentUser$.next(userData);
                if (this.router.url === '/login' || this.router.url === '/') {
                    await this.redirectToDashboard(userData);
                }

            } else {

                this.currentUser$.next(null);

            }

        } catch (error) {

            console.error('[AuthService] Error loading profile:', error);
            this.currentUser$.next(null);

        } finally {

            this.loading$.next(false);

        }

    }

    private normalizeMobile(mobile: string): string {
        const digits = mobile.replace(/\D/g, '');
        if (digits.length > 10) {
            return digits.slice(-10);
        }
        return digits;
    }

    private async findUserByMobile(mobileNumber: string): Promise<User | null> {
        if (!mobileNumber) {
            return null;
        }

        try {
            const users = await firstValueFrom(this.apiService.getUsers({ mobileNumber }));
            return this.normalizeApiUser(users[0] ?? null);
        } catch (error) {
            console.error('[AuthService] Failed to load user from API:', error);
            const message =
                (error as any)?.error?.error ||
                (error as any)?.message ||
                'Failed to reach API';
            throw new Error(message);
        }
    }

    private async findUserByMobileAndRole(mobileNumber: string, role: User['role']): Promise<User | null> {
        if (!mobileNumber) {
            return null;
        }

        try {
            const users = await firstValueFrom(this.apiService.getUsers({ mobileNumber, role }));
            return this.normalizeApiUser(users[0] ?? null);
        } catch (error) {
            console.error('[AuthService] Failed to load user role from API:', error);
            const message =
                (error as any)?.error?.error ||
                (error as any)?.message ||
                'Failed to reach API';
            throw new Error(message);
        }
    }

    private normalizeApiUser(user: User | null): User | null {
        if (!user) {
            return null;
        }

        return {
            ...user,
            id: user.id || user.uniqueId,
            uniqueId: user.uniqueId || user.id,
            userName: user.userName || user.name || '',
            mobileNumber: user.mobileNumber || user.mobile || '',
            name: user.userName || user.name || '',
            mobile: user.mobileNumber || user.mobile || ''
        };
    }

    private storeRole(role: User['role']) {
        localStorage.setItem(this.ROLE_STORAGE_KEY, role);
    }

    private getStoredRole(): User['role'] | null {
        const role = localStorage.getItem(this.ROLE_STORAGE_KEY);
        if (role === 'admin' || role === 'resident' || role === 'gatekeeper') {
            return role;
        }
        return null;
    }

    private clearStoredRole() {
        localStorage.removeItem(this.ROLE_STORAGE_KEY);
    }

    private async redirectToDashboard(user: User) {
        await this.router.navigate([`/${user.role}`], { replaceUrl: true });
    }

    /**
     * Logout
     */
    async logout() {

        try {

            await signOut(this.auth);
            this.clearStoredRole();
            this.currentUser$.next(null);
            await this.router.navigate(['/login']);

        } catch (error) {

            console.error('[AuthService] Logout error:', error);

        }

    }

}
