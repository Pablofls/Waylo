import { RetosScreen } from "@/components/screens/Retos";
import { getChallenges, getRanking } from "@/lib/data";

export default async function RetosPage() {
  const [{ challenges }, ranking] = await Promise.all([getChallenges(), getRanking()]);
  return <RetosScreen challenges={challenges} ranking={ranking} />;
}
