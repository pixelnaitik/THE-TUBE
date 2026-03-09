import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
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
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6" /> Watch History
      </h1>
      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <p className="text-gray-500 text-center py-16">No watch history yet. Start watching videos!</p>
      )}
    </div>
  );
}
