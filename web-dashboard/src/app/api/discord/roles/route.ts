import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.DISCORD_BOT_TOKEN!;
  const guildId = '1337387446035419177';
  
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch roles from Discord API', status: res.status }, { status: 500 });
    }

    const roles = await res.json();
    return NextResponse.json(roles);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
