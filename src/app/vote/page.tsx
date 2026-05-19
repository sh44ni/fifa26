import { prisma } from "@/lib/prisma";
import { VotingForm } from "@/components/vote/VotingForm";
import { InvalidTokenScreen } from "@/components/vote/InvalidTokenScreen";

export default async function VotePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidTokenScreen />;
  }

  // Validate token against DB
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });

  if (!settings || settings.votingToken !== token) {
    return <InvalidTokenScreen />;
  }

  return <VotingForm token={token} />;
}
