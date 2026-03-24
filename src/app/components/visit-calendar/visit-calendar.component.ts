import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Visitor } from '../../models/visitor.model';
import { CommonInputComponent } from '../common-input/common-input.component';
import { CommonButtonComponent } from '../common-button/common-button.component';

@Component({
  selector: 'visit-calendar',
  standalone: true,
  imports: [CommonModule, IonicModule, NgIf, NgFor, DatePipe, FormsModule, CommonInputComponent, CommonButtonComponent],
  styles: [],
  template: `
  
    <div class="-ml-5 -mr-5 sticky top-0 z-10">
  <div class="m-0 overflow-hidden bg-white p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] relative ">
    <div class="flex items-center justify-between">
      <!-- Left: Calendar Icon + Date labels -->
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-[14px] " style="background: var(--ion-color-primary-rgb);">
          <ion-icon color="primary" name="calendar-clear" class="text-[22px]"></ion-icon>
        </div>
        <div>
          <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wide m-0 mb-1">Selected Date</p>
          <h3 class="text-[15px] font-semibold text-slate-800 leading-tight m-0">{{ selectedDateLabel }}</h3>
        </div>
      </div>
      <!-- Right: Badge / Indicator -->
      <div class="flex items-center gap-1.5" >
        <div class="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-bold" style="background: var(--ion-color-primary-rgb); color: var(--ion-color-primary);">
          {{ filteredVisitors.length }} {{ filteredVisitors.length === 1 ? 'Visit' : 'Visits' }}
        </div>
        <ion-icon name="chevron-down" class="text-slate-400 text-[15px]"></ion-icon>
      </div>
    </div>
    <!-- absolute click triggering layer for modal sheet -->
    <div (click)="isCalendarOpen = true" class="absolute inset-0 z-20 w-full h-full cursor-pointer"></div>
  </div>

  <ion-modal [isOpen]="isCalendarOpen" (didDismiss)="isCalendarOpen = false" [breakpoints]="[0, 0.54]" [initialBreakpoint]="0.54" class="custom-sheet-modal">
    <ng-template>
      <div class="px-5 py-4 bg-white border-b border-slate-100/80 flex items-center justify-between">
        <h2 class="m-0 text-[16px] font-bold text-slate-800">Select Date</h2>
        <button (click)="isCalendarOpen = false" class="m-0 p-0 hover:opacity-75 text-[14px] font-extrabold text-[var(--ion-color-primary)] bg-transparent border-0 cursor-pointer">DONE</button>
      </div>

      <ion-content class="ion-padding" color="light">
          <ion-datetime 
            presentation="date" 
            [value]="currentSelectedDate" 
            (ionChange)="onDateChange($event)"
            [highlightedDates]="highlightedDates"
            style="width: 100%; max-width: 100%;"
            class="w-full bg-white shadow-sm font-semibold"
          ></ion-datetime>
      </ion-content>
    </ng-template>
  </ion-modal>
  <div class="px-4 flex gap-1.5 mb-2 bg-white py-2 items-center text-center">
    <app-common-button 
      label="All" 
      (btnClick)="changeTab('all')" 
      class="flex-1" 
      size="small"
      [color]="selectedTab === 'all' ? 'primary' : 'medium'" 
      [fill]="selectedTab === 'all' ? 'solid' : 'clear'" 
      customClass="font-extrabold text-[12px] h-[34px] rounded-xl"
    ></app-common-button>

    <app-common-button 
      label="Walk-In" 
      (btnClick)="changeTab('walk-in')" 
      class="flex-1" 
      size="small"
      [color]="selectedTab === 'walk-in' ? 'primary' : 'medium'" 
      [fill]="selectedTab === 'walk-in' ? 'solid' : 'clear'" 
      customClass="font-extrabold text-[11px] h-[34px] rounded-xl"
    ></app-common-button>

    <app-common-button 
      label="Pre-Approved" 
      (btnClick)="changeTab('pre-approved')" 
      class="flex-1" 
      size="small"
      [color]="selectedTab === 'pre-approved' ? 'primary' : 'medium'" 
      [fill]="selectedTab === 'pre-approved' ? 'solid' : 'clear'" 
      customClass="font-extrabold text-[11px] h-[34px] rounded-xl"
    ></app-common-button>
  </div>
</div>
<ng-container *ngIf="showList">
  <ion-list class="mt-1 overflow-hidden rounded-[14px] border border-slate-200 bg-white" *ngIf="filteredVisitors.length > 0; else empty">
    <ion-item *ngFor="let v of filteredVisitors" lines="full" class="min-h-14">
      <ion-label class="min-w-0">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate text-[14px] font-bold text-slate-800">{{ v.visitorName }}</div>
            <div class="truncate text-[12px] text-slate-500"> Flat {{ v.flatNumber }} • {{ v.mobile }}
              <span *ngIf="v.purpose" class="text-slate-400"> ({{ v.purpose }})</span>
            </div>
            <div class="mt-0.5 text-[11px] text-slate-400">{{ getVisitorDate(v) | date:'shortTime' }}</div>
          </div>
          <ion-badge [color]="getStatusColor(v.status)" class="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold">
            {{ getStatusLabel(v.status) }}
          </ion-badge>
        </div>
      </ion-label>
    </ion-item>
  </ion-list>
  <ng-template #empty>
    <div class="px-4 py-8 text-center text-slate-400">
      <div class="text-[13px]">{{ emptyText }}</div>
    </div>
  </ng-template>
</ng-container>
  `
})
export class VisitCalendarComponent implements OnChanges {
  @Input() visitors: Visitor[] = [];
  @Input() title = 'Calendar Visits';
  @Input() subtitle = 'Select a date to see visits';
  @Input() emptyText = 'No visits found for this date.';
  @Input() showList: boolean = true;
  @Input() selectedDate?: string;

  @Output() selectedDateChange = new EventEmitter<string>();
  @Output() tabChange = new EventEmitter<'all' | 'walk-in' | 'pre-approved'>();

  highlightedDates: any[] = [];
  selectedDateInternal = '';
  filteredVisitors: Visitor[] = [];
  isCalendarOpen = false;
  readonly triggerId = `visit-cal-trigger-${Math.random().toString(36).slice(2)}`;
  selectedTab: 'all' | 'walk-in' | 'pre-approved' = 'all';



  get selectedDateLabel(): string {
    const d = this.safeDateFromIso(this.currentSelectedDate);
    if (!d) return this.currentSelectedDate;

    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return 'Today, ' + d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }

    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  get highlightedVisitsDates() {
    const datesMap = new Set<string>();
    (this.visitors ?? []).forEach((v) => {
      datesMap.add(this.toLocalIsoDate(this.getVisitorDate(v)));
    });

    return Array.from(datesMap).map((date) => ({
      date,
      textColor: '#92400e',
      backgroundColor: '#fef3c7',
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDate'] && this.selectedDate) {
      this.selectedDateInternal = this.selectedDate;
    }
    if (changes['visitors'] || changes['selectedDate']) {
      this.calculateHighlightedDates();
      this.applyFilter();
    }
  }

  get currentSelectedDate(): string {
    return this.selectedDateInternal;
  }

  onDateChange(ev: any) {
    const value = ev?.detail?.value;
    if (!value) return;
    this.selectedDateInternal = String(value).slice(0, 10);
    this.selectedDateChange.emit(this.selectedDateInternal);
    this.applyFilter();
    this.isCalendarOpen = false;
  }

  onDateChangeRaw(ev: any) {
    const value = typeof ev === 'string' ? ev : ev?.target?.value;
    if (!value) return;
    this.selectedDateInternal = String(value).slice(0, 10);
    this.selectedDateChange.emit(this.selectedDateInternal);
    this.applyFilter();
  }

  openCalendar() {
    this.isCalendarOpen = true;
  }

  closeCalendar() {
    this.isCalendarOpen = false;
  }

  changeTab(tab: 'all' | 'walk-in' | 'pre-approved') {
    this.selectedTab = tab;
    this.tabChange.emit(tab);
    this.applyFilter();
  }

  private applyFilter() {
    const selected = this.currentSelectedDate;
    let list = (this.visitors ?? [])
      .filter((v) => this.toLocalIsoDate(this.getVisitorDate(v)) === selected);

    if (this.selectedTab === 'walk-in') {
      list = list.filter(v => v.purpose !== 'Pre-Approved Guest');
    } else if (this.selectedTab === 'pre-approved') {
      list = list.filter(v => v.purpose === 'Pre-Approved Guest');
    }

    this.filteredVisitors = list.sort((a, b) => this.getVisitorDate(b).getTime() - this.getVisitorDate(a).getTime());
  }


  private calculateHighlightedDates() {
    if (!this.visitors) return;
    const dateMap = new Map<string, boolean>();
    this.visitors.forEach(v => {
      const d = this.getVisitorDate(v);
      dateMap.set(this.toLocalIsoDate(d), true);
    });

    this.highlightedDates = Array.from(dateMap.keys()).map(dateStr => ({
      date: dateStr,
      backgroundColor: 'rgba(var(--ion-color-primary-rgb), 0.15)',
      textColor: 'var(--ion-color-primary)'
    }));
  }

  getVisitorDate(v: Visitor): Date {
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

  private safeDateFromIso(isoDate: string): Date | null {
    if (!isoDate || isoDate.length < 10) return null;
    const d = new Date(`${isoDate}T00:00:00`);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  getStatusColor(status: Visitor['status']) {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'checked-in':
        return 'primary';
      case 'checked-out':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: Visitor['status']) {
    switch (status) {
      case 'checked-in':
        return 'Inside';
      case 'checked-out':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
}
