export const runtime = "nodejs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { plaidClient } from '@/lib/plaid';
import { AccountsGetRequest, LiabilitiesGetRequest } from "plaid";

export async function POST(request: Request) {
  const token = request.headers.get("authorization");
  console.log("🧪 Incoming Authorization header:", token); // Debug line

  const { userId } = await auth(request);
  console.log("🔐 Clerk userId:", userId); // Debug line

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  const MODEL_NAME = "gemini-2.0-flash-exp";
  const safetySettings: any[] = []; // ✅ silences warning


  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings });

    const { history, message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let financialContext = "";
    const requiresFinancialData = /debt|pay off|financial|accounts|balance|strategy/i.test(message);

    if (requiresFinancialData) {
      const plaidItem = await prisma.userPlaidItem.findUnique({ where: { userId } });

      if (!plaidItem) {
        return NextResponse.json({
          text: "To give you a financial strategy, please connect your bank account using the Plaid connection button.",
          needsPlaidConnection: true
        });
      }

      try {
        const accessToken = decrypt(plaidItem.encryptedAccessToken);
        let accountDetails = "Financial Context:\n";

        try {
          const balanceRequest: AccountsGetRequest = { access_token: accessToken };
          const balanceResponse = await plaidClient.accountsBalanceGet(balanceRequest);
          balanceResponse.data.accounts.forEach(acc => {
            accountDetails += `- ${acc.name} (${acc.subtype}): Balance $${acc.balances.current ?? acc.balances.available ?? 'N/A'}\n`;
          });
        } catch (err) {
          console.error("Plaid Balance Fetch Error:", err);
        }

        try {
          const liabilitiesRequest: LiabilitiesGetRequest = { access_token: accessToken };
          const liabilitiesResponse = await plaidClient.liabilitiesGet(liabilitiesRequest);
          liabilitiesResponse.data.liabilities?.credit?.forEach(cred => {
            const apr = cred.aprs.find(a =>
              ['balance_transfer_apr', 'cash_apr', 'purchase_apr'].includes(a.apr_type)
            );
            accountDetails += `- ${cred.name}: Balance $${cred.last_payment_amount ?? 'N/A'}, APR ${apr ? apr.apr_percentage + '%' : 'N/A'}\n`;
          });
        } catch (err) {
          console.error("Plaid Liabilities Fetch Error:", err);
        }

        financialContext = accountDetails;

      } catch (decryptionError) {
        console.error("Access Token Decryption Failed for user:", userId, decryptionError);
        return NextResponse.json({ error: 'Internal server error processing financial data.' }, { status: 500 });
      }
    }

    const systemInstruction = `You're an assistant helping with financial literacy and debt strategy. Add disclaimers if needed.`;
    const promptToSend = financialContext ? `${message}\n\n${financialContext}` : message;

    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessage(promptToSend);
    const text = result.response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to get response from AI" }, { status: 500 });
  }
}
