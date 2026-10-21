import { PostDetail } from "@/components/screens/PostDetail";
import { getPost } from "@/lib/data";

export default async function PublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail post={await getPost(id)} />;
}
