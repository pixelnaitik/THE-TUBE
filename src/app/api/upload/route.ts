import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { processVideoToHLS } from '@/lib/videoProcessor';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = (formData.get('video') || formData.get('file')) as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create video record
    const newVideo = await prisma.video.create({
      data: {
        title,
        description: description || null,
        tags: tags || null,
        status: 'PROCESSING',
        authorId: user.id,
      }
    });

    // Save raw file to disk
    const rawUploadsDir = path.join(process.cwd(), 'public', 'raw-uploads');
    if (!fs.existsSync(rawUploadsDir)) fs.mkdirSync(rawUploadsDir, { recursive: true });

    const rawFilePath = path.join(rawUploadsDir, `${newVideo.id}.mp4`);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(rawFilePath, buffer);

    // Trigger FFmpeg processing asynchronously
    processVideoToHLS(newVideo.id, rawFilePath).catch((err) => {
      console.error("FFmpeg background job failed:", err);
    });

    // Notify subscribers
    const subscribers = await prisma.subscription.findMany({
      where: { channelId: user.id }
    });

    if (subscribers.length > 0) {
      await prisma.notification.createMany({
        data: subscribers.map(sub => ({
          userId: sub.subscriberId,
          type: 'NEW_VIDEO',
          message: `${user.name || 'A channel you follow'} uploaded: ${title}`,
          link: `/watch/${newVideo.id}`
        }))
      });
    }

    return NextResponse.json({
      message: 'Upload successful, processing started',
      videoId: newVideo.id
    }, { status: 200 });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
