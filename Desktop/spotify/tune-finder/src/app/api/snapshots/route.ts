import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/dbConnect'; // Using the recommended connection helper
import Snapshot, { ITrack } from '@/models/Snapshot'; // Using the corrected model import

/**
 * Fetches all snapshots for the logged-in user for a specific time range.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get('time_range') || 'medium_term';
  const userId = token.sub;

  try {
    // Ensure the database is connected before every operation
    await dbConnect();

    const snapshots = await Snapshot.find({
      userId: userId,
      timeRange: timeRange,
    }).sort({ createdAt: -1 }); // Sort by newest first
    console.log(snapshots);

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error("[GET /api/snapshots] Error fetching snapshots:", error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}

/**
 * Saves a new snapshot for the logged-in user.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const { tracks, timeRange } = (await req.json()) as { tracks: ITrack[]; timeRange: string };
    const userId = token.sub;

    if (!tracks || tracks.length === 0 || !timeRange) {
        return NextResponse.json({ error: 'Missing tracks or timeRange in request body' }, { status: 400 });
    }

    // Ensure the database is connected
    await dbConnect();

    const newSnapshot = new Snapshot({
      userId,
      timeRange,
      tracks,
    });

    await newSnapshot.save();

    return NextResponse.json({ message: 'Snapshot saved successfully', snapshot: newSnapshot }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/snapshots] Error saving snapshot:', error);
    return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 });
  }
}

