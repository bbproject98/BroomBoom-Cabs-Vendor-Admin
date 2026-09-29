

export type LeadStatus =
  | "new"
  | "contacted"
  | "review"
  | "approved"
  | "rejected";

export type PackageTier =
  | "silver"
  | "gold"
  | "platinum"
  | "undecided";

export interface VendorLead {
  id: string;
  applicationId: string;
  fullName: string;
  mobile: string;
  alternatePhone?: string;
  email?: string;
  state?: string;
  city: string;
  pincode?: string;
  proposedAddress?: string;
  spaceStatus?: string;
  carpetArea?: string;
  preferredPackage: string;
  packageName?: string;
  investmentBudget?: string;
  financeRequired?: string;
  loanAssistance?: string;
  currentProfession?: string;
  hasExperience?: string;
  message?: string;
  source: string;
  status: LeadStatus;
  adminNotes?: string;

  credentials?:
    | VendorUser
    | {
        userId: string;
        password: string;
        isActive: boolean;
      };

  pendingTicketCount?: number;
  latestTicket?: PlanChangeTicket;
  tickets?: PlanChangeTicket[];

  createdAt: string;
  updatedAt: string;
}

export type TicketStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PAYMENT_COMPLETED"
  | "COMPLETED"
  | "APPROVED"
  | "REJECTED";

export interface PlanChangeTicket {
  id: string;
  ticketId: string;
  applicationId: string;

  vendorName: string;
  vendorMobile: string;
  vendorEmail?: string;

  currentPlan: string;
  requestedPlan: string;
  reason?: string;

  status: TicketStatus | string;
  adminNotes?: string;

  upgradeAmount?: number;
  gatewayFee?: number;
  gstAmount?: number;
  totalAmount?: number;

  paymentStatus?: string;
  paymentId?: string;
  paidAt?: string;

  newUserId?: string;
  newPassword?: string;
  approvedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface VendorUser {
  id: string;
  userId: string;
  password: string;

  applicationId: string;

  vendorName: string;
  vendorMobile: string;
  vendorEmail?: string;

  currentPlan: string;
  isActive: boolean;

  lastLoginAt?: string;

  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus =
  | "active"
  | "pending"
  | "cancelled"
  | "expired";

export type PaymentStatus =
  | "PAID"
  | "ACTIVE"
  | "PENDING"
  | "FAILED";

export interface VendorSubscription {
  id: string;
  subscriptionId: string;
  applicationId: string;

  vendorName: string;
  vendorMobile: string;
  vendorEmail?: string;

  city: string;
  state?: string;

  planTier: "silver" | "gold" | "platinum" | string;
  planName: string;
  billingCycle: string;

  status: SubscriptionStatus | string;

  startDate: string;
  endDate?: string;

  territoryScope?: string;
  hasExclusivity: boolean;

  orderId: string;

  cfOrderId?: string;
  cfPaymentId?: string;
  paymentSessionId?: string;
  paymentMethod?: string;

  paymentStatus: PaymentStatus | string;

  baseAmount: number;
  gatewayFee: number;
  gstAmount: number;
  totalAmount: number;

  currency: string;

  paidAt?: string;
  adminNotes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  vendor: {
    total: number;
    newToday: number;
    contacted: number;
    approved: number;
    silver: number;
    gold: number;
    platinum: number;
  };

  subscriptions: {
    total: number;
    active: number;
    pending: number;
    totalRevenue: number;
    silver: number;
    gold: number;
    platinum: number;
  };

  pendingTickets: number;

  topCities: {
    city: string;
    count: number;
  }[];

  recentActivity: {
    id: string;
    type: "vendor";
    title: string;
    subtitle: string;
    status: LeadStatus;
    timestamp: string;
  }[];
}
