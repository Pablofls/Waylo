import { RetosScreen } from "@/components/screens/Retos";
import { getChallenges } from "@/lib/data";

export default async function RetosPage() {
  return <RetosScreen challenges={await getChallenges()} />;
}
