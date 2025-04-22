export const runtime = "nodejs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { plaidClient } from "@/lib/plaid";
import { AccountsGetRequest, LiabilitiesGetRequest } from "plaid";

export async function POST(request: Request) {
  const token = request.headers.get("authorization");
  const { userId } = await auth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  const MODEL_NAME = "gemini-2.0-flash-exp";

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Missing Gemini API key" },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const { history, message, context } = await request.json();
    let { accounts = [], transactions = [] } = context ?? {};

    // If transactions are missing, sync from DB
    if (!transactions.length) {
      transactions = await prisma.plaidTransaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      });
    }

    // If accounts are missing, pull balances
    if (!accounts.length) {
      try {
        const plaidItem = await prisma.userPlaidItem.findUnique({
          where: { userId },
        });

        if (plaidItem) {
          const accessToken = decrypt(plaidItem.encryptedAccessToken);
          const response = await plaidClient.accountsGet({
            access_token: accessToken,
          });
          accounts = response.data.accounts;
        }
      } catch (err) {
        console.error("Failed to fetch accounts for context", err);
      }
    }

    // Handle basic balance question locally
    if (/how much.*plaid.*account/i.test(message)) {
      const total = accounts.reduce(
        (sum, acc) =>
          sum + (acc.balances?.available ?? acc.balances?.current ?? 0),
        0
      );
      return NextResponse.json({
        text: `Your total available balance is $${total.toFixed(2)}.`,
      });
    }

    // Include Plaid financial context if needed
    let financialContext = "";
    const requiresFinancialData =
      /debt|pay off|financial|accounts|balance|strategy|spend|expense/i.test(
        message
      );

    if (requiresFinancialData && accounts.length) {
      let accountDetails = "Financial Context:\n";

      accounts.forEach((acc) => {
        accountDetails += `- ${acc.name} (${acc.subtype}): Balance $${
          acc.balances?.current ?? acc.balances?.available ?? "N/A"
        }\n`;
      });

      transactions.slice(0, 5).forEach((tx) => {
        accountDetails += `Transaction: ${tx.name} $${tx.amount} on ${tx.date}\n`;
      });

      financialContext = accountDetails;
    }

    const systemInstruction = `You're an assistant helping with financial literacy and debt strategy. Add disclaimers if needed.`;
    const promptToSend = financialContext
      ? `${message}\n\n${financialContext}`
      : message;

    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessage(promptToSend);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    );
  }
}
