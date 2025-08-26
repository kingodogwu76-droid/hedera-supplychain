import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    const topicId = process.env.HEDERA_TOPIC_ID!;
    const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;

    // 1) fetch all topic messages
    const res = await fetch(url);
    const data = await res.json();

    // 2) filter by batchId
    const messages = data.messages
      .map((msg: any) => {
        try {
          return JSON.parse(Buffer.from(msg.message, "base64").toString("utf8"));
        } catch {
          return null;
        }
      })
      .filter((msg: any) => msg && msg.batchId === batchId);

    // 3) sort by timestamp
    messages.sort(
      (a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json({ batchId, history: messages });
  } catch (err: unknown) {
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Unknown error" },
    { status: 500 }
  );
}
}
