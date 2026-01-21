import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/dbConnect';
import UserTopTracks from '@/models/UserTopTracks';

const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;

// --- Interfaces for Spotify API Data ---
interface SpotifyImage {
  url: string;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  images: SpotifyImage[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
}

interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

// --- Interface for Database Track Data ---
interface DBTrack {
  trackId: string;
  name: string;
  rank: number;
  artist: string;
  albumArt: string;
}

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
    // CASE 1: Fetch Specific History Snapshot
    if (historyId) {
      const historicalData = await UserTopTracks.findById(historyId);
      
      if (!historicalData) {
        return NextResponse.json({ error: 'History record not found' }, { status: 404 });
      }

      const formattedTracks = historicalData.tracks.map((t: DBTrack) => ({
        id: t.trackId,
        name: t.name,
        rank: t.rank,
        artist: t.artist,
        albumArt: t.albumArt,
        spotifyUrl: `https://open.spotify.com/track/${t.trackId}`,
        rankChange: 'same'
      }));

      return NextResponse.json(formattedTracks);
    }

    // CASE 2: Live Data with Ranking Comparison
    
    // 2a. Fetch Live Data from Spotify
    const response = await fetch(`${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=50`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch from Spotify' }, { status: response.status });
    }

    const data: SpotifyTopTracksResponse = await response.json();

    // 2b. Fetch Latest Snapshot from DB
    const previousEntry = await UserTopTracks.findOne({
        userId,
        timeRange
    }).sort({ lastUpdated: -1 });

    const previousRanks = new Map<string, number>();
    
    if (previousEntry && previousEntry.tracks) {
        previousEntry.tracks.forEach((t: DBTrack) => {
            previousRanks.set(t.trackId, t.rank);
        });
    }

    // 2c. Process Live Data
    const tracks = data.items.map((item: SpotifyTrack, index: number) => {
      const currentRank = index + 1;
      const previousRank = previousRanks.get(item.id);
      
      let rankChange = 'new';
      if (previousRank) {
        if (currentRank < previousRank) rankChange = 'up';
        else if (currentRank > previousRank) rankChange = 'down';
        else rankChange = 'same';
      }

      return {
        rank: currentRank,
        id: item.id,
        name: item.name,
        artist: item.artists.map((a: SpotifyArtist) => a.name).join(', '),
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