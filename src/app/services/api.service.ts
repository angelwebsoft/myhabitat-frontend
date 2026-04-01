import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PreApprovedGuest, User, Visitor, MaintenanceBill, Payment } from '../models/visitor.model';
import { Observable, timeout } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    // --- User Endpoints ---

    getUsers(params?: {
        role?: User['role'];
        societyId?: string;
        mobileNumber?: string;
        uniqueId?: string;
    }): Observable<User[]> {
        return this.http.get<User[]>(`${this.baseUrl}/users`, { params }).pipe(timeout(5000));
    }

    createUser(user: Partial<User>): Observable<User> {
        return this.http.post<User>(`${this.baseUrl}/users`, user);
    }

    updateUser(userId: string, updates: Partial<User>): Observable<User> {
        return this.http.patch<User>(`${this.baseUrl}/users/${userId}`, updates);
    }

    deleteUser(userId: string): Observable<{ ok: boolean }> {
        return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/users/${userId}`);
    }

    // --- Pre-Approved Guests ---

    getPreApproved(params?: {
        societyId?: string;
        residentId?: string;
        mobile?: string;
        status?: PreApprovedGuest['status'];
        qrToken?: string;
    }): Observable<PreApprovedGuest[]> {
        return this.http.get<PreApprovedGuest[]>(`${this.baseUrl}/preapproved`, { params });
    }

    createPreApproved(payload: Partial<PreApprovedGuest> & {
        residentId: string;
        visitorName: string;
        mobile: string;
        validDate: any;
        societyId: string;
    }): Observable<PreApprovedGuest> {
        return this.http.post<PreApprovedGuest>(`${this.baseUrl}/preapproved`, payload);
    }

    consumePreApproved(payload: { qrToken: string; gatekeeperId: string }): Observable<{ guest: PreApprovedGuest; visitor: Visitor }> {
        return this.http.post<{ guest: PreApprovedGuest; visitor: Visitor }>(`${this.baseUrl}/preapproved/consume`, payload);
    }

    // --- Visitor Endpoints ---

    getVisitors(): Observable<Visitor[]> {
        return this.http.get<Visitor[]>(`${this.baseUrl}/visitors`);
    }

    getVisitorsByQuery(params?: {
        societyId?: string;
        status?: Visitor['status'];
        residentId?: string;
        gatekeeperId?: string;
        id?: string;
    }): Observable<Visitor[]> {
        return this.http.get<Visitor[]>(`${this.baseUrl}/visitors`, { params });
    }

    createVisitor(visitor: Omit<Visitor, 'id' | 'createdAt'>): Observable<Visitor> {
        // Let the backend generate a unique visitor id to avoid collisions on rapid submits.
        return this.http.post<Visitor>(`${this.baseUrl}/visitors`, { ...visitor });
    }

    updateVisitor(visitorId: string, updates: Partial<Visitor>): Observable<Visitor> {
        return this.http.patch<Visitor>(`${this.baseUrl}/visitors/${visitorId}`, updates);
    }

    // --- Maintenance Endpoints ---

    createBill(bill: {
        flat_number: string;
        resident_id: string;
        amount: number;
        month: string;
        year: number;
        due_date: string;
        society_id: string;
    }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.baseUrl}/maintenance/create`, bill);
    }

    getAllBills(societyId: string): Observable<MaintenanceBill[]> {
        return this.http.get<MaintenanceBill[]>(`${this.baseUrl}/maintenance/all`, { params: { societyId } });
    }

    getMyBills(residentId: string): Observable<MaintenanceBill[]> {
        return this.http.get<MaintenanceBill[]>(`${this.baseUrl}/maintenance/my`, { params: { resident_id: residentId } });
    }

    payBill(payload: {
        bill_id: string;
        amount: number;
        payment_mode: string;
        transaction_id?: string;
    }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.baseUrl}/maintenance/pay`, payload);
    }


    // --- Test Connection ---
    testConnection(): Observable<any> {
        return this.http.get(`${this.baseUrl}/test`);
    }
}

