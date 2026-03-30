import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/visitor.model';
import { CommonInputComponent } from '../common-input/common-input.component';

@Component({
    selector: 'app-dashboard-header',
    standalone: true,
    imports: [CommonModule, IonicModule, CommonInputComponent, FormsModule],
    templateUrl: './dashboard-header.component.html'
})
export class DashboardHeaderComponent {
    @Input() user: User | null = null;
    @Input() role: 'admin' | 'resident' | 'gatekeeper' = 'admin';
    @Input() actionIcon = 'log-out';
    @Input() label = '';
    @Input() welcomeSubtitle = 'Manage your operations';
    @Input() searchPlaceholder = 'Search requests...';
    @Input() showSearch = true;

    searchTerm: string = '';

    @Output() action = new EventEmitter<void>();
    @Output() search = new EventEmitter<string>();

    get firstName(): string {
        return this.user?.userName?.split(' ')[0] || '';
    }

    get subtitle(): string {
        if (this.role === 'resident') return `FLAT ${this.user?.flatNumber || 'N/A'}`;
        if (this.role === 'admin') return 'ADMINISTRATOR';
        if (this.role === 'gatekeeper') return 'GATEKEEPER';
        return '';
    }

    get themeBorder(): string {
        if (this.role === 'resident') return 'border-indigo-100';
        if (this.role === 'gatekeeper') return 'border-orange-100';
        return 'border-emerald-100';
    }

    get themeShadow(): string {
        if (this.role === 'resident') return 'shadow-indigo-500/30';
        if (this.role === 'gatekeeper') return 'shadow-orange-500/30';
        return 'shadow-emerald-500/30';
    }

    get actionButtonClass(): string {
        // Standardized size and shape
        const baseSize = 'h-11';
        const shape = this.label ? 'rounded-2xl px-5' : 'w-11 rounded-xl items-center justify-center';

        // Now using THEME colors (bg-primary corresponds to role-based colors in variables.scss)
        const colors = (this.role === 'admin' && this.actionIcon === 'log-out')
            ? 'bg-slate-100 text-slate-500' // Keep logout neutral for admin
            : 'bg-primary text-white';

        return `flex items-center ${baseSize} ${shape} ${colors} transition-all active:scale-95 outline-none border-0 shadow-lg`;
    }

    onActionClick() {
        this.action.emit();
    }

    onSearchInternal(val: any) {
        this.searchTerm = val;
        this.search.emit(val);
    }
}
