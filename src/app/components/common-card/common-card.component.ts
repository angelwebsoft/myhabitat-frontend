import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-common-card',
    templateUrl: './common-card.component.html',
    standalone: true,
    imports: [CommonModule, IonicModule],
    styles: [`
    .modern-card {
      
      border-radius: 10px;
      padding: 6px 14px;
      background: #ffffff;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.03), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(226, 232, 240, 0.5); /* Very light slate-200 */
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modern-card:active {
      transform: scale(0.985);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .title-group {
      flex: 1;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a; /* Slate-900 */
      margin: 0;
      letter-spacing: -0.025em;
    }

    .card-subtitle {
      font-size: 0.95rem;
      font-weight: 600;
      color: #64748b; /* Slate-500 */
      margin-top: 2px;
      margin-bottom: 0;
    }

    .card-body {
      padding: 8px 0 0;
    }

    .card-footer {
      border-top: 1px solid rgba(241, 245, 249, 0.8); /* Slate-100 */
      padding-top: 16px;
      margin-top: 20px;
    }

    /* Color accents as subtle top borders for status-themed cards */
    .color-indicator {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      opacity: 0.8;
    }

    .bg-primary { background: #3b82f6; }
    .bg-secondary { background: #64748b; }
    .bg-success { background: #22c55e; }
    .bg-warning { background: #f59e0b; }
    .bg-danger { background: #ef4444; }
    .bg-medium { background: #94a3b8; }
    .bg-light { background: #f1f5f9; }
    .bg-tertiary { background: #8b5cf6; }
  `]
})
export class CommonCardComponent {
    @Input() cardTitle?: string;
    @Input() cardSubtitle?: string;
    @Input() customClass: string = '';
    @Input() color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'medium' | 'light';
}
