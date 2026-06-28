import BelgeYuklemeClient from "./BelgeYuklemeClient";

export default function BelgeYuklemePage({ params }: { params: { token: string } }) {
  return <BelgeYuklemeClient token={params.token} />;
}
