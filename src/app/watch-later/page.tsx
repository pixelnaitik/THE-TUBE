import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import EmptyState from '@/components/EmptyState';
import { Clock } from 'lucide-react';

export default async function WatchLaterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect('/login');

  const items = await prisma.watchLater.findMany({
    where: { userId: user.id },
    include: { video: { include: { author: true } } },
    orderBy: { addedAt: 'desc' }
  });

  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <div>
      <h1 className="page-title mb-5 flex items-center gap-2 text-white">
        <Clock className="h-6 w-6 text-blue-300" /> Watch Later
      </h1>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.filter(item => item.video.status === 'READY').map(item => (
            <VideoCard
              key={item.id}
              id={item.video.id}
              title={item.video.title}
              thumbnail={item.video.thumbnail || `https://picsum.photos/seed/${item.video.id}/640/360`}
              channelName={item.video.author.name || 'Creator'}
              channelAvatar={item.video.author.image || `https://api.dicebear.com/7.x/initials/svg?seed=${item.video.author.name}`}
              views={`${item.video.views} views`}
              timestamp={formatDate(item.video.createdAt)}
              duration={item.video.duration ? `${Math.floor(item.video.duration / 60)}:${String(item.video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title="Nothing saved yet"
          description="Save videos to Watch Later and build your personal queue."
          ctaHref="/"
          ctaLabel="Browse videos"
        />
      )}
    </div>
  );
}