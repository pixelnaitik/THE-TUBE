import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// POST /api/user/avatar — Upload user avatar
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('avatar') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Save avatar to public/avatars/{userId}.ext
  const ext = file.name.split('.').pop() || 'jpg';
  const avatarDir = path.join(process.cwd(), 'public', 'avatars');
  if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

  const fileName = `${user.id}.${ext}`;
  const filePath = path.join(avatarDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const avatarUrl = `/avatars/${fileName}`;
  await prisma.user.update({ where: { id: user.id }, data: { image: avatarUrl } });

  return NextResponse.json({ avatarUrl });
}
