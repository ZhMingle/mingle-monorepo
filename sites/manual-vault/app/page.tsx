import { getChatGPTUser } from "./chatgpt-auth";
import ManualApp from "./manual-app";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  return <ManualApp signedIn={Boolean(user)} />;
}
