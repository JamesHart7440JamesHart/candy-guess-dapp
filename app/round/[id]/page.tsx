import GamePage from "@/components/pages/GamePage";

export const dynamic = "force-dynamic";

type RoundPageProps = {
  params: {
    id: string;
  };
};

export default function RoundPage({ params }: RoundPageProps) {
  return <GamePage roundId={Number(params.id)} />;
}
