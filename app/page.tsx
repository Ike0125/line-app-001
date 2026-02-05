import { requireSession } from "@/app/_lib/requireSession";

export default async function Page() {
  await requireSession();
  return <div>Home</div>;
}
