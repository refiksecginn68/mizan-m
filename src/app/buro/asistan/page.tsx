import { redirect } from "next/navigation";

// MizanAI kanonik rotası /buro/mizanai'ye taşındı — eski /buro/asistan yönlendirir.
export default function BuroAsistanPage() {
  redirect("/buro/mizanai");
}
