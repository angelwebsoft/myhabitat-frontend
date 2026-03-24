import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';

@Component({
    selector: 'app-common-button',
    standalone: true,
    imports: [CommonModule, IonButton, IonIcon, IonSpinner],
    templateUrl: './common-button.component.html',
})
export class CommonButtonComponent {
    @Input() label: string = '';
    @Input() color: string = 'primary';
    @Input() expand: 'block' | 'full' | undefined = 'block';
    @Input() fill: 'clear' | 'outline' | 'solid' = 'solid';
    @Input() disabled: boolean = false;
    @Input() isLoading: boolean = false;
    @Input() icon: string = '';
    @Input() iconPosition: 'start' | 'end' = 'start';
    @Input() size: 'small' | 'default' | 'large' | 'auto' = 'default';
    @Input() customClass: string = '';
    @Input() loadingText: string = 'Please wait...';

    @Output() btnClick = new EventEmitter<Event>();

    onClick(event: Event) {
        if (!this.disabled && !this.isLoading) {
            this.btnClick.emit(event);
        } else {
            event.stopPropagation();
            event.preventDefault();
        }
    }
}
