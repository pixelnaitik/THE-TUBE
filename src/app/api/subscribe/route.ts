import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// POST /api/subscribe — Subscribe/unsubscribe to a channel
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { channelId } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.id === channelId) return NextResponse.json({ error: 'Cannot subscribe to yourself' }, { status: 400 });

  const existing = await prisma.subscription.findUnique({
    where: { subscriberId_channelId: { subscriberId: user.id, channelId } }
  });

  if (existing) {
    await prisma.subscription.delete({ where: { id: existing.id } });
    return NextResponse.json({ subscribed: false });
  }

  await prisma.subscription.create({ data: { subscriberId: user.id, channelId } });

  // Send notification to channel owner
  await prisma.notification.create({
    data: {
      userId: channelId,
      type: 'NEW_SUBSCRIBER',
      message: `${user.name || user.email} subscribed to your channel`,
      link: `/channel/${user.id}`
    }
  });

  return NextResponse.json({ subscribed: true });
}
