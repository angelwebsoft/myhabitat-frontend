import { Component, forwardRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonIcon } from '@ionic/angular/standalone';

@Component({
    selector: 'app-common-input',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonInput,
        IonIcon
    ],
    templateUrl: './common-input.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CommonInputComponent),
            multi: true,
        },
    ],
})
export class CommonInputComponent implements ControlValueAccessor {
    @Input() label: string = '';
    @Input() type: string = 'text';
    @Input() inputmode: string = 'text';
    @Input() placeholder: string = '';
    @Input() clearInput: boolean = false;
    @Input() maxlength?: number;
    @Input() lines: 'none' | 'inset' | 'full' = 'none';
    @Input() position: 'stacked' | 'floating' | 'fixed' = 'stacked';
    @Input() disabled: boolean = false;
    @Input() errorText?: string;
    @Input() iconName?: string;
    @Input() customClass: string = '';
    @Input() iconClass: string = '';

    @ViewChild('ionInput', { static: false }) ionInput: any;

    value: any = '';

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

    onModelChange(value: any) {
        this.value = value;
        this.onChange(value);
    }

    onBlur() {
        this.onTouched();
    }
}
