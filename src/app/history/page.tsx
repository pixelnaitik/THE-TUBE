import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import EmptyState from '@/components/EmptyState';
import { Clock } from 'lucide-react';

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect('/login');

  const history = await prisma.watchHistory.findMany({
    where: { userId: user.id },
    include: { video: { include: { author: true } } },
    orderBy: { watchedAt: 'desc' },
    take: 50
  });

  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <div>
      <h1 className="page-title mb-5 flex items-center gap-2 text-white">
        <Clock className="h-6 w-6 text-blue-300" /> Watch History
      </h1>
      {history.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {history.filter(h => h.video.status === 'READY').map(h => (
            <VideoCard
              key={h.id}
              id={h.video.id}
              title={h.video.title}
              thumbnail={h.video.thumbnail || `https://picsum.photos/seed/${h.video.id}/640/360`}
              channelName={h.video.author.name || 'Creator'}
              channelAvatar={h.video.author.image || `https://api.dicebear.com/7.x/initials/svg?seed=${h.video.author.name}`}
              views={`${h.video.views} views`}
              timestamp={formatDate(h.watchedAt)}
              duration={h.video.duration ? `${Math.floor(h.video.duration / 60)}:${String(h.video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title="No watch history"
          description="Start watching videos and we will keep track of them here for quick revisit."
          ctaHref="/"
          ctaLabel="Start watching"
        />
      )}
    </div>
  );
}