import { NextRequest, NextResponse } from 'next/server';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const SEARCH_ENDPOINT = `https://api.spotify.com/v1/search`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  return response.json();
};

// Spotify API response types
interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  images: { url: string }[];
  release_date: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const { access_token } = await getAccessToken();
    const response = await fetch(`${SEARCH_ENDPOINT}?q=${query}&type=track&limit=5`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch from Spotify');

    const data: SpotifySearchResponse = await response.json();

    const items = data.tracks.items.map((item) => ({
      id: item.id,
      name: item.name,
      artist: item.artists.map((artist) => artist.name).join(', '),
      albumArt: item.album.images[0]?.url,
      spotifyUrl: item.external_urls.spotify,
      releaseYear: parseInt(item.album.release_date.split('-')[0]),
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch data from Spotify' }, { status: 500 });
  }
}
