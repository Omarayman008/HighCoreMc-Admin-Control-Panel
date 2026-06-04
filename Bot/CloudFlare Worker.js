const CLIENT_ID = env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = env.DISCORD_CLIENT_SECRET;
const BOT_TOKEN = env.DISCORD_BOT_TOKEN;
const GUILD_ID = env.DISCORD_GUILD_ID;
const REDIRECT_URI = 'https://wano-mc.github.io/Promotions-system/';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Secrets are stored in Cloudflare Worker environment variables (Settings > Variables)
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ---- Exchange code for token ----
    if (path === '/discord/callback' && request.method === 'POST') {
      try {
        const { code } = await request.json();
        if (!code) return jsonResp({ error: 'No code provided' }, 400);

        // Exchange code for access token
        const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
          }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.error) return jsonResp({ error: tokenData.error_description || tokenData.error }, 400);

        // Get user info
        const userRes = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const user = await userRes.json();

        // Get guild member info (roles)
        let guildMember = null;
        let guildRoles = [];
        try {
          const memberRes = await fetch(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user.id}`,
            { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
          );
          if (memberRes.ok) {
            guildMember = await memberRes.json();

            // Get guild roles to map IDs to names
            const rolesRes = await fetch(
              `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`,
              { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
            );
            if (rolesRes.ok) {
              const allRoles = await rolesRes.json();
              guildRoles = allRoles
                .filter(r => guildMember.roles.includes(r.id))
                .map(r => ({ id: r.id, name: r.name, color: r.color ? '#' + r.color.toString(16).padStart(6, '0') : null, position: r.position }))
                .sort((a, b) => b.position - a.position);
            }
          }
        } catch (e) {
          console.error('Guild fetch error:', e);
        }

        const avatar = user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`;

        return jsonResp({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            globalName: user.global_name || user.username,
            avatar: avatar,
            discriminator: user.discriminator,
          },
          guild: {
            nickname: guildMember?.nick || null,
            roles: guildRoles,
            joinedAt: guildMember?.joined_at || null,
          },
        });
      } catch (e) {
        return jsonResp({ error: e.message }, 500);
      }
    }

    // ---- Existing webhook proxy (keep your old functionality) ----
    if (request.method === 'POST' && (path === '/' || path === '/webhook')) {
      try {
        const body = await request.json();
        const webhookUrl = body.webhookUrl;
        delete body.webhookUrl;
        if (webhookUrl) {
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          return new Response(await res.text(), { status: res.status, headers: CORS_HEADERS });
        }
        return jsonResp({ error: 'No webhookUrl' }, 400);
      } catch (e) {
        return jsonResp({ error: e.message }, 500);
      }
    }

    return jsonResp({ status: 'Discord OAuth Worker active', endpoints: ['/discord/callback'] });
  },
};

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
