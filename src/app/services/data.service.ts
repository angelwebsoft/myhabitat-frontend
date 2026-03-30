import { Injectable, inject } from '@angular/core';
import { Visitor, PreApprovedGuest, User } from '../models/visitor.model';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';
import * as QRCode from 'qrcode';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private visitors: Visitor[] = [];
    private residents: User[] = [];
    private preApproved: PreApprovedGuest[] = [];

    private visitors$ = new BehaviorSubject<Visitor[]>([]);
    private residents$ = new BehaviorSubject<User[]>([]);

    private notificationService = inject(NotificationService);
    private apiService = inject(ApiService);
    private authService = inject(AuthService);
    private realtimeService = inject(RealtimeService);

    private stopVisitorCreatedListener?: () => void;
    private stopVisitorUpdatedListener?: () => void;
    private stopPreApprovedCreatedListener?: () => void;
    private stopPreApprovedUsedListener?: () => void;

    constructor() {
        this.initRealtime();
    }

    private initRealtime() {
        this.authService.currentUser$.subscribe(user => {
            if (!user) {
                this.realtimeService.disconnect();
                this.stopVisitorCreatedListener?.();
                this.stopVisitorUpdatedListener?.();
                this.stopPreApprovedCreatedListener?.();
                this.stopPreApprovedUsedListener?.();
                this.stopVisitorCreatedListener = undefined;
                this.stopVisitorUpdatedListener = undefined;
                this.stopPreApprovedCreatedListener = undefined;
                this.stopPreApprovedUsedListener = undefined;
                return;
            }

            this.realtimeService.connect(user.societyId);
            this.refreshResidents(user.societyId).catch(console.error);
            this.refreshVisitors(user.societyId).catch(console.error);

            if (!this.stopVisitorCreatedListener) {
                this.stopVisitorCreatedListener = this.realtimeService.onVisitorCreated((visitor) => {
                    this.upsertVisitor(visitor);

                    if (visitor.status === 'pending') {
                        this.notificationService.notify(
                            visitor.residentId,
                            'Visitor Request',
                            `${visitor.visitorName} is at the gate for you.`
                        );
                    }
                });
            }

            if (!this.stopVisitorUpdatedListener) {
                this.stopVisitorUpdatedListener = this.realtimeService.onVisitorUpdated((visitor) => {
                    this.upsertVisitor(visitor);
                });
            }

            if (!this.stopPreApprovedCreatedListener) {
                this.stopPreApprovedCreatedListener = this.realtimeService.onPreApprovedCreated((guest) => {
                    this.upsertPreApproved(guest);
                });
            }

            if (!this.stopPreApprovedUsedListener) {
                this.stopPreApprovedUsedListener = this.realtimeService.onPreApprovedUsed((guest) => {
                    this.upsertPreApproved(guest);
                });
            }
        });
    }

    private upsertPreApproved(guest: PreApprovedGuest) {
        const index = this.preApproved.findIndex(g => g.id === guest.id);
        if (index >= 0) {
            this.preApproved[index] = { ...this.preApproved[index], ...guest };
        } else {
            this.preApproved.unshift(guest);
        }
        this.emitMergedVisitors();
    }

    private upsertVisitor(visitor: Visitor) {
        if (!visitor?.id) return;

        const index = this.visitors.findIndex(v => v.id === visitor.id);
        if (index >= 0) {
            this.visitors[index] = { ...this.visitors[index], ...visitor };
        } else {
            this.visitors.unshift(visitor);
        }
        this.emitMergedVisitors();
    }

    private saveVisitors() {
        this.emitMergedVisitors();
    }

    private saveResidents() {
        this.emitResidents();
    }

    private emitMergedVisitors() {
        // Map pre-approved guests to "Pseudo-Visitors" so they show in listings
        const pseudoVisitors: Visitor[] = this.preApproved
            .filter(g => g.status === 'pending')
            .map(g => {
                const resident = this.residents.find(r => r.id === g.residentId);
                return {
                    id: g.id,
                    qrToken: g.qrToken,
                    visitorName: g.visitorName,
                    mobile: g.mobile,
                    flatNumber: resident?.flatNumber || '?',
                    purpose: 'Pre-Approved Guest',
                    vehicleNumber: g.vehicleNumber,
                    photoURL: '',
                    status: 'pending',
                    checkInTime: g.validDate, // Using validDate as primary time for calendar
                    checkOutTime: null,
                    gatekeeperId: '',
                    residentId: g.residentId,
                    societyId: g.societyId,
                    createdAt: g.createdAt || g.validDate
                };
            });

        // Combine and dedup (Visitor record takes precedence if it exists for same guest via consumer logic)
        const combined = [...this.visitors, ...pseudoVisitors];
        this.visitors$.next(combined);
    }

    private emitResidents() {
        this.residents$.next([...this.residents]);
    }

    private generateId(prefix: string) {
        return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
    }

    async generateQrDataUrl(text: string): Promise<string> {
        try {
            return await QRCode.toDataURL(text, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                }
            });
        } catch {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="white"/><text x="20" y="50" font-size="20" font-weight="bold" fill="#0f172a">Token: ${text}</text></svg>`;
            return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        }
    }

    private async refreshResidents(societyId: string, role: User['role'] = 'resident') {
        const residents = await firstValueFrom(this.apiService.getUsers({ societyId, role }));
        this.residents = residents;
        this.saveResidents();
        return residents;
    }

    async getUsersBySocietyAndRole(societyId: string, role: User['role']) {
        return await firstValueFrom(this.apiService.getUsers({ societyId, role }));
    }

    async createUser(user: Partial<User>) {
        return await firstValueFrom(this.apiService.createUser(user));
    }

    async updateUser(userId: string, updates: Partial<User>) {
        return await firstValueFrom(this.apiService.updateUser(userId, updates));
    }

    async deleteUser(userId: string) {
        return await firstValueFrom(this.apiService.deleteUser(userId));
    }

    private async refreshVisitors(societyId: string) {
        const [visitors, pre] = await Promise.all([
            firstValueFrom(this.apiService.getVisitorsByQuery({ societyId })),
            firstValueFrom(this.apiService.getPreApproved({ societyId, status: 'pending' }))
        ]);

        this.visitors = visitors;
        this.preApproved = pre;
        this.saveVisitors();
        return visitors;
    }

    async addVisitor(visitor: Omit<Visitor, 'id' | 'createdAt'>) {
        const newVisitor = await firstValueFrom(this.apiService.createVisitor(visitor));
        await this.refreshVisitors(visitor.societyId);

        // Notify the resident
        if (newVisitor.status === 'pending') {
            this.notificationService.notify(
                newVisitor.residentId,
                'Visitor Request',
                `${newVisitor.visitorName} is at the gate for you.`
            );
        }

        return newVisitor;
    }

    async getVisitorsByStatus(societyId: string, status: Visitor['status'], residentId?: string): Promise<Observable<Visitor[]>> {
        this.refreshVisitors(societyId).catch(error => {
            console.error('Failed to load visitors', error);
        });
        return this.visitors$.pipe(
            map(list =>
                list.filter(v =>
                    v.societyId === societyId &&
                    v.status === status &&
                    (!residentId || v.residentId === residentId)
                )
            )
        );
    }

    async getVisitorsBySociety(societyId: string, residentId?: string, gatekeeperId?: string): Promise<Observable<Visitor[]>> {
        this.refreshVisitors(societyId).catch(error => {
            console.error('Failed to load visitors', error);
        });
        return this.visitors$.pipe(
            map(list =>
                list.filter(v =>
                    v.societyId === societyId &&
                    (!residentId || v.residentId === residentId) &&
                    (!gatekeeperId || v.gatekeeperId === gatekeeperId)
                )
            )
        );
    }

    async refreshVisitorsForSociety(societyId: string) {
        return await this.refreshVisitors(societyId);
    }

    async updateVisitorStatus(visitorId: string, status: Visitor['status'], additionalData: Partial<Visitor> = {}) {
        const existingVisitor = this.visitors.find(v => v.id === visitorId);
        if (!existingVisitor) {
            return;
        }

        await firstValueFrom(this.apiService.updateVisitor(visitorId, {
            status,
            ...additionalData
        }));
        await this.refreshVisitors(existingVisitor.societyId);
    }

    async uploadVisitorPhoto(visitorId: string, base64Image: string) {
        await firstValueFrom(this.apiService.updateVisitor(visitorId, { photoURL: base64Image }));
        const existingVisitor = this.visitors.find(vis => vis.id === visitorId);
        if (existingVisitor) {
            await this.refreshVisitors(existingVisitor.societyId);
        }
        return base64Image;
    }

    async checkPreApproved(mobile: string, societyId: string): Promise<PreApprovedGuest | null> {
        const matches = await firstValueFrom(this.apiService.getPreApproved({ societyId, mobile, status: 'pending' }));
        return matches?.[0] ?? null;
    }

    async addPreApprovedGuest(guest: Omit<PreApprovedGuest, 'id' | 'status' | 'qrToken' | 'createdAt'>) {
        const payload: Parameters<ApiService['createPreApproved']>[0] = {
            id: this.generateId('pre_'),
            residentId: guest.residentId,
            visitorName: guest.visitorName,
            mobile: guest.mobile,
            vehicleNumber: guest.vehicleNumber,
            validDate: guest.validDate,
            societyId: guest.societyId,
            status: 'pending'
        };
        return await firstValueFrom(this.apiService.createPreApproved(payload));
    }

    async markPreApprovedUsed(id: string) {
        // Status is updated server-side when consuming via QR.
        return;
    }

    async consumePreApprovedByQr(qrToken: string, gatekeeperId: string) {
        const response = await firstValueFrom(this.apiService.consumePreApproved({ qrToken, gatekeeperId }));

        // Immediately update local UI stores for instant feedback
        if (response.guest) {
            this.upsertPreApproved(response.guest);
        }
        if (response.visitor) {
            this.upsertVisitor(response.visitor);
        }

        return response;
    }

    async listPreApprovedForResident(societyId: string, residentId: string) {
        return await firstValueFrom(this.apiService.getPreApproved({ societyId, residentId }));
    }

    async findResidentByFlat(flatNumber: string, societyId: string) {
        if (!this.residents.length) {
            await this.refreshResidents(societyId);
        }
        const match = this.residents.find(
            r => r.flatNumber === flatNumber && r.societyId === societyId && r.role === 'resident'
        );
        return match ?? null;
    }

    async addResident(resident: { userName: string; mobileNumber: string; flatNumber: string; societyId: string }) {
        const createdResident = await firstValueFrom(this.apiService.createUser({
            uniqueId: this.generateId('res_'),
            userName: resident.userName,
            mobileNumber: resident.mobileNumber,
            role: 'resident',
            flatNumber: resident.flatNumber,
            societyId: resident.societyId
        }));
        await this.refreshResidents(resident.societyId);
        return createdResident;
    }

    getResidentsBySociety(societyId: string): Observable<User[]> {
        this.refreshResidents(societyId).catch(error => {
            console.error('Failed to load residents', error);
        });
        return this.residents$.pipe(
            map(list => list.filter(r => r.societyId === societyId && r.role === 'resident'))
        );
    }

    async findUserByMobileAndRole(mobile: string, role: User['role']): Promise<User | null> {
        const matches = await firstValueFrom(this.apiService.getUsers({ role, mobileNumber: mobile }));
        return matches[0] ?? null;
    }

    async seedDemoResidents(societyId: string) {
        const existing = await firstValueFrom(this.apiService.getUsers({ societyId, role: 'resident' }));
        if (existing.length > 0) {
            return;
        }

        const demoResidents = [
            { userName: 'Rahul Sharma', mobileNumber: '9000000001', flatNumber: 'A-101', societyId },
            { userName: 'Priya Patel', mobileNumber: '9000000002', flatNumber: 'A-102', societyId },
            { userName: 'Amit Verma', mobileNumber: '9000000003', flatNumber: 'A-103', societyId },
            { userName: 'Sneha Iyer', mobileNumber: '9000000004', flatNumber: 'A-104', societyId },
            { userName: 'Karan Mehta', mobileNumber: '9000000005', flatNumber: 'B-201', societyId },
            { userName: 'Neha Singh', mobileNumber: '9000000006', flatNumber: 'B-202', societyId },
            { userName: 'Rohit Gupta', mobileNumber: '9000000007', flatNumber: 'B-203', societyId },
            { userName: 'Anjali Desai', mobileNumber: '9000000008', flatNumber: 'B-204', societyId },
            { userName: 'Vikram Joshi', mobileNumber: '9000000009', flatNumber: 'C-301', societyId },
            { userName: 'Pooja Nair', mobileNumber: '9000000010', flatNumber: 'C-302', societyId },
            { userName: 'Manish Reddy', mobileNumber: '9000000011', flatNumber: 'C-303', societyId },
            { userName: 'Divya Shah', mobileNumber: '9000000012', flatNumber: 'C-304', societyId }
        ];

        for (const r of demoResidents) {
            await this.addResident(r);
        }
    }

    async getAllVisitors(societyId: string): Promise<Visitor[]> {
        return await this.refreshVisitors(societyId);
    }
}
