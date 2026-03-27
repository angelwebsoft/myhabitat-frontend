import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonIcon, IonModal, IonDatetime, IonContent } from '@ionic/angular/standalone';

@Component({
    selector: 'app-common-date',
    standalone: true,
    imports: [CommonModule, FormsModule, IonIcon, IonModal, IonDatetime, IonContent],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CommonDateComponent),
            multi: true,
        },
    ],
    templateUrl: './common-date.component.html',
})
export class CommonDateComponent implements ControlValueAccessor {
    @Input() label: string = '';
    @Input() placeholder: string = 'Select Date';
    @Input() disabled: boolean = false;
    @Input() iconName?: string = 'calendar-outline';
    @Input() customClass: string = '';
    @Input() errorText?: string;

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
