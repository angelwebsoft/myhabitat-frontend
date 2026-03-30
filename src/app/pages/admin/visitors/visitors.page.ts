import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Visitor } from '../../../models/visitor.model';
import { BehaviorSubject, Observable, Subscription, combineLatest, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { VisitCalendarComponent } from '../../../components/visit-calendar/visit-calendar.component';
import { CommonCardComponent } from '../../../components/common-card/common-card.component';
import { CommonInputComponent } from '../../../components/common-input/common-input.component';
import { CommonVisitorDetailsComponent } from '../../../components/common-visitor-details/common-visitor-details.component';
import { CommonQrComponent } from '../../../components/common-qr/common-qr.component';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-admin-visitors',
    templateUrl: './visitors.page.html',
    standalone: true,
    imports: [CommonModule, IonicModule, AppHeaderComponent, VisitCalendarComponent, FormsModule, CommonCardComponent, CommonInputComponent, CommonQrComponent, CommonVisitorDetailsComponent],
    host: { 'class': 'admin-theme flex flex-col min-h-full' }
})
export class AdminVisitorsPage implements OnInit, OnDestroy {
    visitors$: Observable<Visitor[]> = of([]);
    filteredVisitors$: Observable<Visitor[]> = of([]);

    private route = inject(ActivatedRoute);
    private dataService = inject(DataService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private sub?: Subscription;
    selectedVisitor: Visitor | null = null;
    isDetailsModalOpen = false;
    isQrModalOpen = false;
    qrTokenForLargeView = '';

    selectedDate = this.toLocalIsoDate(new Date());
    searchTerm = '';
    private selectedDate$ = new BehaviorSubject<string>(this.selectedDate);
    private filterStatus$ = new BehaviorSubject<string>('');
    private selectedTab$ = new BehaviorSubject<'upcoming' | 'walk-in' | 'pre-approved'>('upcoming');
    private searchTerm$ = new BehaviorSubject<string>('');

    ngOnInit() {
        this.sub = combineLatest([
            this.authService.currentUser$,
            this.route.queryParams
        ]).subscribe(async ([user, params]) => {
            if (!user) return;

            if (params['status']) {
                this.filterStatus$.next(params['status']);
            }
            if (params['date'] === 'today') {
                this.selectedDate$.next(this.toLocalIsoDate(new Date()));
            }

            const stream = await this.dataService.getVisitorsBySociety(user.societyId);
            this.visitors$ = stream;

            this.filteredVisitors$ = combineLatest([
                this.visitors$,
                this.selectedDate$,
                this.filterStatus$,
                this.selectedTab$,
                this.searchTerm$
            ]).pipe(
                map(([list, selectedDate, status, tab, searchTerm]) => {
                    const today = this.toLocalIsoDate(new Date());
                    let filtered = [...list];

                    // Priority 1: Search Filter
                    if (searchTerm) {
                        const s = searchTerm.toLowerCase();
                        filtered = filtered.filter(v =>
                            v.visitorName.toLowerCase().includes(s) ||
                            v.mobile?.includes(s) ||
                            v.flatNumber?.toLowerCase().includes(s) ||
                            v.vehicleNumber?.toLowerCase().includes(s)
                        );
                    }

                    // Priority 2: Status Filter (from Dashboard)
                    if (status === 'checked-in') {
                        filtered = filtered.filter(v => v.status === 'checked-in');
                    } else {
                        // Priority 3: Tab/Date Filter
                        if (tab === 'upcoming') {
                            filtered = filtered.filter(v =>
                                v.purpose === 'Pre-Approved Guest' &&
                                v.status === 'pending' &&
                                this.toLocalIsoDate(this.getVisitorDate(v)) >= today
                            );
                        } else if (tab === 'walk-in') {
                            filtered = filtered.filter(v =>
                                this.toLocalIsoDate(this.getVisitorDate(v)) === selectedDate &&
                                v.purpose !== 'Pre-Approved Guest'
                            );
                        } else if (tab === 'pre-approved') {
                            filtered = filtered.filter(v =>
                                this.toLocalIsoDate(this.getVisitorDate(v)) === selectedDate &&
                                v.purpose === 'Pre-Approved Guest'
                            );
                        }
                    }

                    return filtered.sort((a, b) => this.getVisitorDate(b).getTime() - this.getVisitorDate(a).getTime());
                })
            );
        });
    }

    onTabChange(tab: any) {
        this.selectedTab$.next(tab);
    }

    onSearchInternal(val: string) {
        this.searchTerm = val;
        this.searchTerm$.next(val);
    }

    viewVisitorDetails(v: Visitor) {
        this.selectedVisitor = v;
        this.isDetailsModalOpen = true;
    }

    showFullQr(token: string) {
        this.qrTokenForLargeView = token;
        this.isQrModalOpen = true;
    }

    closeQrModal() {
        this.isQrModalOpen = false;
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    onDateChange(isoDate: string) {
        this.selectedDate = isoDate;
        this.selectedDate$.next(isoDate);
        // Reset status filter if date is explicitly changed
        this.filterStatus$.next('');
    }

    private getVisitorDate(v: Visitor): Date {
        const raw = (v.checkInTime ?? v.createdAt) as any;
        const d = raw instanceof Date ? raw : new Date(raw);
        return Number.isFinite(d.getTime()) ? d : new Date();
    }

    private toLocalIsoDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
