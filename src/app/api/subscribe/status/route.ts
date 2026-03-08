import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// GET /api/subscribe/status?channelId=xxx — Check subscription status
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ subscribed: false });

  const channelId = req.nextUrl.searchParams.get('channelId');
  if (!channelId) return NextResponse.json({ subscribed: false });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ subscribed: false });

  const sub = await prisma.subscription.findUnique({
    where: { subscriberId_channelId: { subscriberId: user.id, channelId } }
  });

  return NextResponse.json({ subscribed: !!sub });
}
