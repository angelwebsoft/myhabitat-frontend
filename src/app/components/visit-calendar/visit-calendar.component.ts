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
  templateUrl: './visit-calendar.component.html',
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
    { label: 'Approved', value: 'pre-approved' }
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
