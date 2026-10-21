import Link from "next/link";
import { Avatar } from "./Avatar";

interface Props {
  id: string;
  name: string;
  detail: string;
  href?: string;
  right?: React.ReactNode;
}

/** Fila de persona: el área izquierda enlaza a su perfil y la derecha aloja acciones. */
export function PersonRow({ id, name, detail, href = `/personas/${id}`, right }: Props) {
  return (
    <li className="flex min-h-[72px] items-center gap-2 border-b border-line bg-white pr-4">
      <Link href={href} className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-3 pl-4">
        <Avatar name={name} size={48} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{name}</span>
          <span className="block truncate text-sm text-muted">{detail}</span>
        </span>
      </Link>
      {right}
    </li>
  );
}
