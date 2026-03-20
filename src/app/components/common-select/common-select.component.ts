import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';

@Component({
    selector: 'app-common-select',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonItem,
        IonLabel,
        IonIcon
    ],
    templateUrl: './common-select.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CommonSelectComponent),
            multi: true,
        },
    ],
})
export class CommonSelectComponent implements ControlValueAccessor {
    @Input() label: string = '';
    @Input() options: { label: string; value: any }[] = [];
    @Input() placeholder: string = '';
    @Input() disabled: boolean = false;
    @Input() errorText?: string;
    @Input() iconName?: string;
    @Input() lines: 'none' | 'inset' | 'full' = 'none';
    @Input() position: 'stacked' | 'floating' | 'fixed' = 'stacked';

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
