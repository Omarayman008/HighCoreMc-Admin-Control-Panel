import { NextResponse } from 'next/server';

export async function GET() {
  // Use environment variables in production. Hardcoding here for the direct Live requirement.
  const token = process.env.DISCORD_BOT_TOKEN!;
  const channelId = '1487139736748425236';
  const messageId = '1508162784339165376';
  
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
      next: { revalidate: 0 } // always live
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Discord API', status: res.status }, { status: 500 });
    }

    const message = await res.json();
    
    if (!message.components || message.components.length === 0) {
      return NextResponse.json({ error: 'No components found in the message' }, { status: 404 });
    }

    
    const mcData = {
        serverName: '--',
        serverIP: '--',
        playersOnline: '0',
        maxPlayers: '0',
        peakPlayers: '0',
        totalLogins: '0',
        serverStatus: 'Offline',
        serverPing: '--',
        health: '--',
        uptime: '--',
        availability: '--',
        uniquePlayers: '0',
        version: '--',
        lastUpdated: new Date().toISOString()
    };

    const mainComponent = message.components[0]?.components || [];
    
    mainComponent.forEach((comp: any) => {
        if (comp.type === 10 && comp.content) {
            const content = comp.content.toLowerCase();
            const rawContent = comp.content;
            
            if (content.includes('server name')) {
                const nameMatch = rawContent.match(/`([^`]+)`/);
                if (nameMatch) mcData.serverName = nameMatch[1];
            }
            else if (content.includes('connection addresses')) {
                const ipMatch = rawContent.match(/Java IP:\s*\*?\*?\s*`([^`]+)`/i);
                const portMatch = rawContent.match(/Java Port:\s*\*?\*?\s*`([^`]+)`/i);
                if (ipMatch && portMatch) {
                    mcData.serverIP = `${ipMatch[1]}:${portMatch[1]}`;
                } else if (ipMatch) {
                    mcData.serverIP = ipMatch[1];
                }
            }
            else if (content.includes('live statistics')) {
               const playersMatch = rawContent.match(/Players Online:\s*\*?\*?\s*`(\d+)\s*\/\s*(\d+)`/i);
               if (playersMatch) {
                   mcData.playersOnline = playersMatch[1];
                   mcData.maxPlayers = playersMatch[2];
               }
               
               const peakVal = rawContent.match(/Peak Players:\s*\*?\*?\s*`(\d+)`/i);
               if (peakVal) mcData.peakPlayers = peakVal[1];
               
               const loginsVal = rawContent.match(/Total Logins:\s*\*?\*?\s*`(\d+)`/i);
               if (loginsVal) mcData.totalLogins = loginsVal[1];
            }
            else if (content.includes('status & health')) {
               const statusMatch = rawContent.match(/Server Status:\s*\*?\*?\s*`([^`]+)`/i);
               if (statusMatch) {
                   // Remove emojis from status string if any e.g. "Open 🔓" -> "Open"
                   mcData.serverStatus = statusMatch[1].replace(/[^\w\s]/gi, '').trim();
               }
               
               const pingVal = rawContent.match(/Server Ping:\s*\*?\*?\s*`(\d+)ms`/i);
               if (pingVal) mcData.serverPing = pingVal[1] + 'ms';
               
               const healthVal = rawContent.match(/Health:\s*\*?\*?\s*`([\d.]+)%`/i);
               if (healthVal) mcData.health = healthVal[1] + '%';
            }
            else if (content.includes('server uptime')) {
               const uptimeMatch = rawContent.match(/Uptime:\s*\*?\*?\s*`([^`]+)`/i);
               if (uptimeMatch) mcData.uptime = uptimeMatch[1].trim();
            }
        }
    });

    return NextResponse.json(mcData);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
