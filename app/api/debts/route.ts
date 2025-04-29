import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, balance, interestRate, minimumPayment, dueDate, extraPayment } = body;

        const debt = await prisma.debt.create({
            data: {
                userId,
                name,
                balance: parseFloat(balance),
                currentBalance: parseFloat(balance),
                interestRate: parseFloat(interestRate),
                minimumPayment: parseFloat(minimumPayment),
                dueDate: new Date(dueDate),
                extraPayment: extraPayment ? parseFloat(extraPayment) : null,
            },
        });

        return NextResponse.json(debt);
    } catch (error) {
        console.error('Error creating debt:', error);
        return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const debts = await prisma.debt.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(debts);
    } catch (error) {
        console.error('Error fetching debts:', error);
        return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
    }
} 