import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Visitor } from '../../models/visitor.model';
import { CommonQrComponent } from '../common-qr/common-qr.component';

@Component({
    selector: 'app-common-visitor-details',
    standalone: true,
    imports: [CommonModule, IonicModule, CommonQrComponent],
    templateUrl: './common-visitor-details.component.html',
    host: { 'class': 'ion-page' },
    styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .badge-status {
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
  `]
})
export class CommonVisitorDetailsComponent implements OnChanges {
    @Input() visitor: Visitor | null = null;
    @Output() qrClick = new EventEmitter<string>();
    @Output() close = new EventEmitter<void>();

    ngOnChanges(changes: SimpleChanges) {
        if (changes['visitor']) {
            console.log('Visitor Details Component - Input Changed:', this.visitor);
        }
    }

    onQrClick(token: string) {
        this.qrClick.emit(token);
    }

    onClose() {
        this.close.emit();
    }
}
