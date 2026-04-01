export interface Society {
  id: string;
  name: string;
  address: string;
  totalFlats: number;
  createdAt: any;
}

export interface User {
  id: string;
  uniqueId: string;
  userName: string;
  mobileNumber: string;
  role: 'admin' | 'resident' | 'gatekeeper';
  photoURL?: string;
  flatNumber?: string;
  vehicleNumber?: string;
  societyId: string;
  residentType?: 'owner' | 'tenant';
  ownerId?: string;
  fcmToken?: string;
  createdAt: any;
  name?: string;
  mobile?: string;
}

export interface Visitor {
  id: string;
  qrToken?: string; // Add this
  visitorName: string;
  mobile: string;
  flatNumber: string;
  purpose: string;
  vehicleNumber?: string;
  photoURL: string;
  status: 'pending' | 'approved' | 'rejected' | 'checked-in' | 'checked-out';
  checkInTime: any | null;
  checkOutTime: any | null;
  gatekeeperId: string;
  residentId: string;
  societyId: string;
  createdAt: any;
}

export interface PreApprovedGuest {
  id: string;
  qrToken?: string;
  residentId: string;
  visitorName: string;
  mobile: string;
  vehicleNumber?: string;
  validDate: any;
  societyId: string;
  status: 'pending' | 'used';
  createdAt?: any;
}

export interface MaintenanceBill {
  id: string;
  flatNumber: string;
  flat_number: string;
  residentId: string;
  resident_id: string;
  amount: number;
  month: string;
  year: number;
  dueDate: any;
  due_date: any;
  status: 'paid' | 'unpaid';
  societyId: string;
  society_id: string;
  createdAt: any;
}

export interface Payment {
  id: string;
  billId: string;
  bill_id: string;
  amount: number;
  paymentMode: 'cash' | 'online';
  payment_mode: 'cash' | 'online';
  transactionId?: string;
  transaction_id?: string;
  paidAt: any;
  paid_at: any;
}

