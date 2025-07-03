import { DataProvider } from '@/contexts/data-context';
import Navbar from '@/components/navbar';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DataProvider>
      <Navbar />
      <main>{children}</main>
    </DataProvider>
  );
}
