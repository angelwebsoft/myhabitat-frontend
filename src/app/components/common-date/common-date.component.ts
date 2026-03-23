import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonIcon, IonModal, IonDatetime } from '@ionic/angular/standalone';

@Component({
    selector: 'app-common-date',
    standalone: true,
    imports: [CommonModule, FormsModule, IonIcon, IonModal, IonDatetime],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CommonDateComponent),
            multi: true,
        },
    ],
    template: `
    <div class="flex items-center mb-1 min-h-[56px] items-center rounded-[18px] bg-[#f1f5f9] pl-4 pr-3 relative cursor-pointer" (click)="openCalendar()">
        <ion-icon *ngIf="iconName" [name]="iconName" class="mr-3 text-slate-400 text-xl"></ion-icon>
        <div class="flex flex-col flex-1">
            <span *ngIf="label" class="text-[11px] font-medium text-slate-400 mt-1.5">{{ label }}</span>
            <div class="py-1.5 text-[15px] font-semibold text-slate-800">
                {{ value ? (value | date:'mediumDate') : placeholder }}
            </div>
        </div>
        <ion-icon name="calendar-outline" class="ml-auto text-slate-400 text-lg"></ion-icon>
    </div>

    <ion-modal [isOpen]="isCalendarOpen" (didDismiss)="isCalendarOpen = false" class="!flex !items-center !justify-center">
        <ng-template>
            <ion-datetime
                presentation="date"
                [value]="value"
                (ionChange)="onDateChange($event)"
                [showDefaultButtons]="true"
                cancelText="Close"
                doneText="Done"
                class="rounded-2xl"
            ></ion-datetime>
        </ng-template>
    </ion-modal>
    `
})
export class CommonDateComponent implements ControlValueAccessor {
    @Input() label: string = '';
    @Input() placeholder: string = 'Select Date';
    @Input() disabled: boolean = false;
    @Input() iconName?: string = 'calendar-outline';

    value: any = '';
    isCalendarOpen = false;

    onChange: any = () => { };
    onTouched: any = () => { };

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onDateChange(ev: any) {
        const value = ev?.detail?.value;
        if (value) {
            this.value = value;
            this.onChange(value);
        }
        this.isCalendarOpen = false;
    }

    openCalendar() {
        if (!this.disabled) {
            this.isCalendarOpen = true;
        }
    }
}
