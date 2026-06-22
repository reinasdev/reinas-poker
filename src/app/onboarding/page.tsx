import { redirect } from "next/navigation";
import { requireUser } from "@/application/auth";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/forms/auth-forms";
import { safeReturnPath } from "@/domain/navigation";

export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = safeReturnPath((await searchParams).next);
  const user = await requireUser({ complete: false });
  if (user.name) redirect(nextPath);
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Primeiro acesso</h1>
        <ProfileForm nextPath={nextPath} />
      </Card>
    </div>
  );
}
