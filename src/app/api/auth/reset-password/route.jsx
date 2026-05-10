import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // ตรวจสอบว่าใช้ bcrypt หรือ bcryptjs ให้ตรงกับที่ install
import { prisma } from '@/lib/prisma'; // <--- ดึงตัวแปร prisma จากที่นี่แทน

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and newPassword required' },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
      },
    });

    return NextResponse.json({
      message: 'Password reset success',
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}