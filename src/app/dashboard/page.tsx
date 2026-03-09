import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Eye, ThumbsUp, Video as VideoIcon, Users, CalendarClock, FileText, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'sky';
}

const toneMap: Record<StatCardProps['tone'], string> = {
  blue: 'text-blue-400 bg-blue-500/10',
  green: 'text-green-400 bg-green-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  rose: 'text-rose-400 bg-rose-500/10',
  violet: 'text-violet-400 bg-violet-500/10',
  sky: 'text-sky-400 bg-sky-500/10',
};

function StatCard({ title, value, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="glass-panel flex items-center justify-between rounded-2xl p-4 sm:p-6">
      <div>
        <p className="mb-1 text-sm font-medium text-muted">{title}</p>
        <h3 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{value}</h3>
      </div>
      <div className={`rounded-full p-3 sm:p-4 ${toneMap[tone]}`}>
        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      videos: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { comments: true, likes: true } } }
      },
      subscribers: true
    }
  });

  if (!user) redirect('/login');

  const readyVideos = user.videos.filter(v => v.status === 'READY');
  const drafts = user.videos.filter(v => v.status === 'DRAFT');
  const scheduled = user.videos.filter(v => v.status === 'SCHEDULED');

  const totalViews = readyVideos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = readyVideos.reduce((sum, v) => sum + v._count.likes, 0);

  const latestForChart = readyVideos.slice(0, 7).reverse();
  const chartMax = Math.max(1, ...latestForChart.map(v => v.views));

  return (
    <div className="mx-auto max-w-[1280px] pt-3 sm:pt-6">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title mb-1 text-[var(--foreground)]">Creator Dashboard</h1>
          <p className="text-sm text-muted sm:text-base">Welcome back, {user.name || 'Creator'}</p>
        </div>
        <Link href="/upload" className="w-full rounded-full bg-[var(--accent)] px-6 py-2 text-center font-semibold text-white transition-colors hover:bg-[var(--accent-strong)] sm:w-auto">
          Upload Video
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Views" value={totalViews} icon={Eye} tone="blue" />
        <StatCard title="Total Likes" value={totalLikes} icon={ThumbsUp} tone="green" />
        <StatCard title="Subscribers" value={user.subscribers.length} icon={Users} tone="violet" />
        <StatCard title="Published" value={readyVideos.length} icon={VideoIcon} tone="rose" />
        <StatCard title="Drafts" value={drafts.length} icon={FileText} tone="sky" />
        <StatCard title="Scheduled" value={scheduled.length} icon={CalendarClock} tone="amber" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="glass-panel rounded-2xl p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Views trend (recent uploads)</h2>
          {latestForChart.length > 0 ? (
            <div className="grid grid-cols-7 gap-2">
              {latestForChart.map(v => (
                <div key={v.id} className="flex flex-col items-center gap-2">
                  <div className="relative h-36 w-full rounded-md bg-[var(--surface-2)]/60">
                    <div className="absolute bottom-0 left-0 right-0 rounded-md bg-blue-500/80" style={{ height: `${Math.max(6, Math.round((v.views / chartMax) * 100))}%` }} />
                  </div>
                  <p className="line-clamp-1 w-full text-center text-[10px] text-muted">{v.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No published videos yet.</p>
          )}
        </section>

        <section className="glass-panel rounded-2xl p-4">
          <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Scheduled queue</h2>
          {scheduled.length > 0 ? (
            <div className="space-y-2">
              {scheduled.slice(0, 5).map((v) => (
                <div key={v.id} className="glass-chip rounded-lg px-3 py-2">
                  <p className="line-clamp-1 text-sm font-medium text-[var(--foreground)]">{v.title}</p>
                  <p className="text-xs text-muted">{v.scheduledFor ? new Date(v.scheduledFor).toLocaleString() : 'No schedule time'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No scheduled uploads.</p>
          )}
        </section>
      </div>

      <h2 className="section-title mb-4 text-[var(--foreground)] sm:mb-6">Recent Content</h2>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-sm text-muted">
                <th className="min-w-[300px] p-4 font-medium">Video</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Comments</th>
                <th className="p-4 font-medium">Likes</th>
                <th className="p-4 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {user.videos.slice(0, 12).map((video) => (
                <tr key={video.id} className="transition-colors hover:bg-[var(--surface-2)]/60">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-black/20">
                        {video.thumbnail ? (
                          <Image src={video.thumbnail} alt="" fill className="object-cover" sizes="96px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[var(--surface-2)] text-gray-500"><VideoIcon className="h-5 w-5" /></div>
                        )}
                        <span className="glass-pill absolute bottom-1 right-1 rounded px-1 text-[10px] text-white">{video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}</span>
                      </div>
                      <Link href={`/watch/${video.id}`} className="line-clamp-2 text-sm font-medium text-[var(--foreground)] hover:text-blue-300">
                        {video.title}
                      </Link>
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-4 text-sm text-muted">{new Date(video.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-muted">{video.views}</td>
                  <td className="p-4 text-sm text-muted">{video._count.comments}</td>
                  <td className="p-4 text-sm text-muted">{video._count.likes}</td>
                  <td className="p-4 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      video.status === 'READY'
                        ? 'bg-green-500/10 text-green-300'
                        : video.status === 'DRAFT'
                          ? 'bg-sky-500/10 text-sky-300'
                          : video.status === 'SCHEDULED'
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {video.status}
                    </span>
                  </td>
                </tr>
              ))}
              {user.videos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    You haven&apos;t uploaded any videos yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
