import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return "";
  return phone.replace(/[^0-9]/g, "");
}

export function getWhatsAppLink(phone: string, applicantName: string, refId: string, type: "Franchise" | "Vendor"): string {
  const clean = cleanPhoneNumber(phone);
  const normalizedPhone = clean.length === 10 ? `91${clean}` : clean;
  const msg = encodeURIComponent(
    `Hello ${applicantName}, greetings from BroomBoom Cabs! We have received your ${type} application (Ref: ${refId}). Our operations manager would like to discuss next steps with you.`
  );
  return `https://wa.me/${normalizedPhone}?text=${msg}`;
}

export function getCredentialsWhatsAppLink(
  phone: string,
  vendorName: string,
  applicationId: string,
  plan: string,
  userId: string,
  password: string,
  portalUrl = process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL || "http://localhost:3001"
): string {
  const clean = cleanPhoneNumber(phone);
  const normalizedPhone = clean.length === 10 ? `91${clean}` : clean;
  const msg = encodeURIComponent(
    `Hello ${vendorName},\n\n` +
    `Welcome to the BroomBoom Vendor & Fleet Partner Network! 🚖\n\n` +
    `Your Vendor Dashboard access has been activated for Application ID: ${applicationId} (${plan.toUpperCase()} Partner).\n\n` +
    `🔐 Your Vendor Portal Login Details:\n` +
    `• Login URL: ${portalUrl}/vendor/login\n` +
    `• User ID: ${userId}\n` +
    `• Password: ${password}\n\n` +
    `Log in to view your Territory Agreement, Fleet Allocation, Onboarding Milestones, and raise Plan Upgrade tickets anytime.\n\n` +
    `Best regards,\n` +
    `BroomBoom Partner Operations Team`
  );
  return `https://wa.me/${normalizedPhone}?text=${msg}`;
}

export function getUpgradeCredentialsWhatsAppLink(
  phone: string,
  vendorName: string,
  applicationId: string,
  newPlan: string,
  newUserId: string,
  newPassword: string,
  portalUrl = process.env.NEXT_PUBLIC_VENDOR_PORTAL_URL || "http://localhost:3001"
): string {
  const clean = cleanPhoneNumber(phone);
  const normalizedPhone = clean.length === 10 ? `91${clean}` : clean;
  const msg = encodeURIComponent(
    `Hello ${vendorName},\n\n` +
    `🎉 Great News! Your Plan Upgrade to ${newPlan.toUpperCase()} PARTNER has been APPROVED & ACTIVATED!\n\n` +
    `Your Application Ref: ${applicationId}\n\n` +
    `🔐 Your New Upgraded Login Credentials:\n` +
    `• Login URL: ${portalUrl}/vendor/login\n` +
    `• Upgraded User ID: ${newUserId}\n` +
    `• Upgraded Password: ${newPassword}\n\n` +
    `Please log in using these upgraded credentials to access your new fleet tiers, exclusive benefits, and updated partner conditions.\n\n` +
    `Best regards,\n` +
    `BroomBoom Partner Operations Team`
  );
  return `https://wa.me/${normalizedPhone}?text=${msg}`;
}

export function calculateUpgradeFees(currentPlan: string, requestedPlan: string) {
  const getBase = (p: string) => {
    const l = (p || "").toLowerCase();
    if (l.includes("plat")) return 50000;
    if (l.includes("gold")) return 20000;
    return 10000;
  };
  const currBase = getBase(currentPlan);
  const reqBase = getBase(requestedPlan);
  // Vendor payment requirement: Payment must be the new plan value
  const upgradeAmount = reqBase;
  const gatewayFee = Math.round(upgradeAmount * 0.03);
  const gstAmount = Math.round(upgradeAmount * 0.05);
  const totalAmount = upgradeAmount + gatewayFee + gstAmount;

  return {
    currBase,
    reqBase,
    upgradeAmount,
    gatewayFee,
    gstAmount,
    totalAmount,
  };
}
