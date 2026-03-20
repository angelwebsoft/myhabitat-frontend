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
  societyId: string;
  fcmToken?: string;
  createdAt: any;
  name?: string;
  mobile?: string;
}

export interface Visitor {
  id: string;
  visitorName: string;
  mobile: string;
  flatNumber: string;
  purpose: string;
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
  validDate: any;
  societyId: string;
  status: 'pending' | 'used';
  createdAt?: any;
}
