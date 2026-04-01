import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { homeGuard } from './guards/home.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [homeGuard],
    children: []
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'gatekeeper',
    loadComponent: () => import('./pages/gatekeeper/dashboard/dashboard.page').then(m => m.GatekeeperDashboardPage),
    canActivate: [roleGuard],
    data: { role: 'gatekeeper' }
  },
  {
    path: 'gatekeeper/new',
    loadComponent: () => import('./pages/gatekeeper/new-visitor/new-visitor.page').then(m => m.NewVisitorPage),
    canActivate: [roleGuard],
    data: { role: 'gatekeeper' }
  },
  {
    path: 'gatekeeper/scan',
    loadComponent: () => import('./pages/gatekeeper/scan-qr/scan-qr.page').then(m => m.ScanQrPage),
    canActivate: [roleGuard],
    data: { role: 'gatekeeper' }
  },
  {
    path: 'resident',
    loadComponent: () => import('./pages/resident/dashboard/dashboard.page').then(m => m.ResidentDashboardPage),
    canActivate: [roleGuard],
    data: { role: 'resident' }
  },
  {
    path: 'resident/pre-approve',
    loadComponent: () => import('./pages/resident/pre-approve/pre-approve.page').then(m => m.PreApprovePage),
    canActivate: [roleGuard],
    data: { role: 'resident' }
  },
  {
    path: 'resident/maintenance',
    loadComponent: () => import('./pages/resident/maintenance/my-bills/my-bills.page').then(m => m.MyBillsPage),
    canActivate: [roleGuard],
    data: { role: 'resident' }
  },

  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/dashboard/dashboard.page').then(m => m.AdminDashboardPage),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/users/residents',
    loadComponent: () => import('./pages/admin/residents/residents.page').then(m => m.AdminResidentsPage),
    canActivate: [roleGuard],
    data: { role: 'admin', viewRole: 'resident' }
  },
  {
    path: 'admin/users/gatekeepers',
    loadComponent: () => import('./pages/admin/residents/residents.page').then(m => m.AdminResidentsPage),
    canActivate: [roleGuard],
    data: { role: 'admin', viewRole: 'gatekeeper' }
  },
  {
    path: 'admin/users/admins',
    loadComponent: () => import('./pages/admin/residents/residents.page').then(m => m.AdminResidentsPage),
    canActivate: [roleGuard],
    data: { role: 'admin', viewRole: 'admin' }
  },
  {
    path: 'admin/visitors',
    loadComponent: () => import('./pages/admin/visitors/visitors.page').then(m => m.AdminVisitorsPage),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/maintenance/bills',
    loadComponent: () => import('./pages/admin/maintenance/bills-list/bills-list.page').then(m => m.BillsListPage),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/maintenance/create',
    loadComponent: () => import('./pages/admin/maintenance/create-bill/create-bill.page').then(m => m.CreateBillPage),
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },

  // Backward-compatible routes (redirect to new URLs)
  {
    path: 'admin/residents',
    redirectTo: 'admin/users/residents',
    pathMatch: 'full'
  },
  {
    path: 'admin/gatekeepers',
    redirectTo: 'admin/users/gatekeepers',
    pathMatch: 'full'
  },
  {
    path: 'admin/admins',
    redirectTo: 'admin/users/admins',
    pathMatch: 'full'
  }
];
