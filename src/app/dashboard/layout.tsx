import { Providers } from '../providers';

export default function DashboardAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
