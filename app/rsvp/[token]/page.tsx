import RsvpClient from "./rsvp-client";

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }> | { token: string };
}) {
  const p = await Promise.resolve(params);
  return <RsvpClient token={p.token} />;
}
