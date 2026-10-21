import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Friends } from "@/components/screens/Friends";

export default function AmigosPage() {
  return (
    <>
      <ScreenHeader title="Amigos" subtitle="Encuentra y sigue a quienes ruedan contigo" back="/inicio" />
      <Friends />
    </>
  );
}
