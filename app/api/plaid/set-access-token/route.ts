// app/api/plaid/set-access-token/route.ts
import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid'; // Adjust path if needed
import { auth } from "@clerk/nextjs/server"; // Use server-side auth
import prisma from '@/lib/prisma'; // Adjust path if needed
import { encrypt } from '@/lib/encryption'; // Adjust path if needed
import { PlaidError } from 'plaid';

export async function POST(request: Request) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { public_token } = await request.json();
        if (!public_token) {
            return NextResponse.json({ error: 'Public token is required' }, { status: 400 });
        }

        const response = await plaidClient.itemPublicTokenExchange({ public_token });
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // **Encrypt the access token before storing**
        const encryptedAccessToken = encrypt(accessToken);

        // **Save to database using Prisma**
        await prisma.userPlaidItem.upsert({
            where: { userId: userId }, // Use userId as the unique constraint for upsert
            update: { // If user already has a link, update it
                itemId: itemId,
                encryptedAccessToken: encryptedAccessToken,
            },
            create: { // If user doesn't have a link, create it
                userId: userId,
                itemId: itemId,
                encryptedAccessToken: encryptedAccessToken,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
         console.error("PLAID TOKEN EXCHANGE ERROR:", error);
         // Handle Plaid specific errors if needed
         if (error instanceof PlaidError) {
             return NextResponse.json({ error: error.error_message || 'Plaid API error', code: error.error_code }, { status: 400 });
         }
         return NextResponse.json({ error: 'Failed to exchange token or save to DB' }, { status: 500 });
    }
}