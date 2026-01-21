import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/dbConnect';
import UserTopTracks from '@/models/UserTopTracks';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('time_range') || 'short_term';

    await dbConnect();

    // Fetch only _id and lastUpdated fields for the dropdown
    const history = await UserTopTracks.find(
      { userId: token.sub, timeRange },
      { lastUpdated: 1, _id: 1 }
    ).sort({ lastUpdated: -1 });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching history dates:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}