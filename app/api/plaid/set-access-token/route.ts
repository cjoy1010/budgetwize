// app/api/plaid/set-access-token/route.ts
import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid'; // Adjust path if needed
import { auth } from "@clerk/nextjs/server"; // Use server-side auth
import prisma from '@/lib/prisma'; // Adjust path if needed
import { encrypt } from '@/lib/encryption'; // Adjust path if needed
import type { PlaidError } from 'plaid';

function hasPlaidErrorShape(error: unknown): error is PlaidError {
    return (
        typeof error === "object" &&
        error !== null &&
        "error_code" in error &&
        "error_message" in error
    );
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
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
        await prisma.userplaiditem.upsert({
            where: { userId },
            update: {
                itemId,
                encryptedAccessToken,
            },
            create: {
                userId,
                itemId,
                encryptedAccessToken,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        if (hasPlaidErrorShape(error)) {
            return NextResponse.json(
                {
                    error: error.error_message || 'Plaid API error',
                    code: error.error_code,
                },
                { status: 400 }
            );
        }

        console.error("PLAID TOKEN EXCHANGE ERROR:", error);
        return NextResponse.json({ error: 'Failed to exchange token or save to DB' }, { status: 500 });
    }
}