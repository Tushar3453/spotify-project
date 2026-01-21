import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/dbConnect';
import UserTopTracks from '@/models/UserTopTracks';

const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken || !token.sub) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get('time_range') || 'medium_term';
  const historyId = searchParams.get('historyId');
  const userId = token.sub;

  await dbConnect();

  try {
    // CASE 1: Fetch Specific History Snapshot (When user selects from dropdown)
    if (historyId) {
      const historicalData = await UserTopTracks.findById(historyId);
      
      if (!historicalData) {
        return NextResponse.json({ error: 'History record not found' }, { status: 404 });
      }

      // Format DB data to match frontend interface
      const formattedTracks = historicalData.tracks.map((t: any) => ({
        id: t.trackId,
        name: t.name,
        rank: t.rank,
        artist: t.artist,
        albumArt: t.albumArt,
        spotifyUrl: `https://open.spotify.com/track/$${t.trackId}`,
        rankChange: 'same' // History views don't show rank changes relative to themselves
      }));

      return NextResponse.json(formattedTracks);
    }

    // CASE 2: Live Data with Ranking Comparison (Default view)
    
    // 2a. Fetch Live Data from Spotify
    const response = await fetch(`${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=50`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch from Spotify' }, { status: response.status });
    }

    const data = await response.json();

    // 2b. Fetch Latest Snapshot from DB for comparison
    const previousEntry = await UserTopTracks.findOne({
        userId,
        timeRange
    }).sort({ lastUpdated: -1 }); // Get the most recent one

    // Create a Map for O(1) lookup: trackId -> previousRank
    const previousRanks = new Map();
    if (previousEntry && previousEntry.tracks) {
        previousEntry.tracks.forEach((t: any) => {
            previousRanks.set(t.trackId, t.rank);
        });
    }

    // 2c. Process Live Data & Calculate Rank Changes
    const tracks = data.items.map((item: any, index: number) => {
      const currentRank = index + 1;
      const previousRank = previousRanks.get(item.id);
      
      let rankChange = 'new';
      if (previousRank) {
        if (currentRank < previousRank) rankChange = 'up';       // Rank improved (e.g., 5 -> 2)
        else if (currentRank > previousRank) rankChange = 'down'; // Rank dropped (e.g., 2 -> 5)
        else rankChange = 'same';
      }

      return {
        rank: currentRank,
        id: item.id,
        name: item.name,
        artist: item.artists.map((a: any) => a.name).join(', '),
        albumArt: item.album.images[0]?.url,
        spotifyUrl: item.external_urls.spotify,
        rankChange: rankChange 
      };
    });

    return NextResponse.json(tracks);

  } catch (error) {
    console.error("Error in top-tracks route:", error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}