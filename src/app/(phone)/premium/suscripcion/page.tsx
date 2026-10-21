import { SubscriptionScreen } from "@/components/screens/Subscription";
import { getPayments, getPlan } from "@/lib/data";

export default async function SuscripcionPage() {
  const [payments, plan] = await Promise.all([getPayments(), getPlan()]);
  return <SubscriptionScreen payments={payments} plan={plan} />;
}
