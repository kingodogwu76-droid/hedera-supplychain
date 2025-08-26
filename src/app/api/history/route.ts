import { NextResponse } from "next/server";
import { Client, TopicMessageQuery } from "@hashgraph/sdk";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    const client =
      process.env.HEDERA_NETWORK === "testnet"
        ? Client.forTestnet()
        : Client.forMainnet();

    client.setOperator(process.env.HEDERA_ACCOUNT_ID!, process.env.HEDERA_PRIVATE_KEY!);

    const topicId = process.env.HEDERA_TOPIC_ID!;
    const history: { step: string; location: string; timestamp: string }[] = [];

    await new Promise<void>((resolve, reject) => {
      new TopicMessageQuery()
        .setTopicId(topicId)
        .subscribe(client, null, (message) => {
          try {
            const data = JSON.parse(Buffer.from(message.contents).toString());
            if (data.batchId === batchId) {
              history.push({
                step: data.event || "unknown",
                location: data.location || "N/A",
                timestamp: data.timestamp,
              });
            }
          } catch (err) {
            console.error("Parse error:", err);
          }
        }, (err) => reject(err));

      // short timeout so query ends
      setTimeout(() => resolve(), 3000);
    });

    return NextResponse.json({ history });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
