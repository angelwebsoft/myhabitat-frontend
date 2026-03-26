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
  
    <div class="-ml-6 -mr-6 sticky top-0 z-10">
  <div class="m-0 overflow-hidden bg-white p-5  relative ">
    <div class="flex items-center justify-between">
      <!-- Left: Calendar Icon + Date labels -->
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary-light">
          <ion-icon class="text-[24px] text-primary" name="calendar-clear"></ion-icon>
        </div>
        <div>
          <p class="text-[12px] font-bold text-slate-400 uppercase tracking-widest m-0 mb-1">Selected Date</p>
          <h3 class="text-[16px] font-black text-slate-800 leading-tight m-0">{{ selectedDateLabel }}</h3>
        </div>
      </div>
      <!-- Right: Badge / Indicator -->
      <div class="flex items-center gap-2" >
        <div class="rounded-full bg-primary-light px-4 py-2 text-[12px] font-black text-primary" >
          {{ filteredVisitors.length }} {{ filteredVisitors.length === 1 ? 'Visit' : 'Visits' }}
        </div>
        <ion-icon name="chevron-down" class="text-slate-300 text-[18px] mt-0.5"></ion-icon>
      </div>
    </div>
    <!-- absolute click triggering layer for modal sheet -->
    <div (click)="isCalendarOpen = true" class="absolute inset-0 z-20 w-full h-full cursor-pointer"></div>
  </div>

  <ion-modal [isOpen]="isCalendarOpen" (didDismiss)="isCalendarOpen = false" [breakpoints]="[0, 0.54]" [initialBreakpoint]="0.54" class="custom-sheet-modal">
    <ng-template>
      <div class="px-5 py-5 bg-white border-b border-slate-100 flex items-center justify-between">
        <h2 class="m-0 text-[18px] font-black text-slate-900">Select Date</h2>
        <button (click)="isCalendarOpen = false" class="m-0 p-0 hover:opacity-75 text-[15px] font-black text-indigo-600 bg-transparent border-0 cursor-pointer">DONE</button>
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
  <div class="px-6 flex gap-3 mb-4 bg-white py-3 items-center">
    <button 
      *ngFor="let tab of tabs"
      (click)="changeTab(tab.value)" 
      class="flex-1 px-4 py-3 rounded-2xl text-[13px] font-black transition-all border-0 cursor-pointer"
      [ngClass]="selectedTab === tab.value ? 'bg-primary text-white shadow-lg shadow-indigo-500/30' : 'bg-primary-light capitalize'"
    >
      {{ tab.label }}
    </button>
  </div>
</div>
<ng-container *ngIf="showList">
  <div class="px-6 space-y-4 pb-10">
    <div *ngFor="let v of filteredVisitors" class="flex items-center justify-between p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm animate__animated animate__fadeInUp">
      <div class="flex items-center gap-4">
        <div class="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
           <ion-icon name="person" class="text-slate-300 text-xl"></ion-icon>
        </div>
        <div class="min-w-0">
          <h3 class="m-0 text-[15px] font-black text-slate-800 truncate">{{ v.visitorName }}</h3>
          <p class="m-0 mt-0.5 text-[12px] font-bold text-slate-400">FLAT {{ v.flatNumber }} • {{ getVisitorDate(v) | date:'shortTime' }}</p>
        </div>
      </div>
      <div class="flex shrink-0">
          <span class="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider" [ngClass]="{
            'bg-amber-100 text-amber-600': v.status === 'pending',
            'bg-emerald-100 text-emerald-600': v.status === 'approved' || v.status === 'checked-in',
            'bg-rose-100 text-rose-600': v.status === 'rejected',
            'bg-slate-100 text-slate-500': v.status === 'checked-out'
          }">
            {{ v.status === 'checked-in' ? 'Inside' : (v.status === 'checked-out' ? 'Completed' : v.status) }}
          </span>
      </div>
    </div>
    
    <div *ngIf="filteredVisitors.length === 0" class="py-12 text-center">
        <div class="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
           <ion-icon name="document-text-outline" class="text-3xl text-slate-200"></ion-icon>
        </div>
        <p class="text-[14px] font-bold text-slate-400">{{ emptyText }}</p>
    </div>
  </div>
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
  tabs: { label: string; value: 'all' | 'walk-in' | 'pre-approved' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Walk-In', value: 'walk-in' },
    { label: 'Pre-Approved', value: 'pre-approved' }
  ];



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
