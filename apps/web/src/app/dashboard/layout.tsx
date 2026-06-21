import { DonorDashboardLayout } from '@/components/dashboard/DonorDashboardLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DonorDashboardLayout>{children}</DonorDashboardLayout>;
}
