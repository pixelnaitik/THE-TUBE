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

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 });
    }

    // 1. Fetch author user by email
    const user = await prisma.user.findUnique({ where: { email: session.user.email as string } });
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Save video metadata to DB (state: PROCESSING)
    const newVideo = await prisma.video.create({
      data: {
        title,
        description,
        status: 'PROCESSING',
        authorId: user.id,
        thumbnail: `https://picsum.photos/seed/${Math.random()}/800/450` // Mock thumbnail for now
      }
    });

    // 2. Setup raw upload directory
    const rawUploadsDir = path.join(process.cwd(), 'public', 'raw-uploads');
    if (!fs.existsSync(rawUploadsDir)) {
      fs.mkdirSync(rawUploadsDir, { recursive: true });
    }

    // 3. Write raw file to disk
    const rawFilePath = path.join(rawUploadsDir, `${newVideo.id}.mp4`);
    
    // Read the file as an array buffer and write it
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(rawFilePath, buffer);

    // 4. Trigger FFmpeg Processing Asynchronously
    // We intentionally don't await this so the API responds quickly to the client
    processVideoToHLS(newVideo.id, rawFilePath)
      .then(() => {
        // Optionally clean up the raw file to save space
         fs.unlinkSync(rawFilePath);
      })
      .catch((err) => {
         console.error("FFmpeg background job failed:", err);
      });

    return NextResponse.json({ 
        message: 'Upload successful, processing started', 
        videoId: newVideo.id 
    }, { status: 200 });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
