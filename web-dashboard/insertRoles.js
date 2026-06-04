import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ungifmcwoxnpeduzxxbr.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

// Need to pass the key when running
const args = process.argv.slice(2);
const key = args[0] || SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, key);

const newRoles = [
  { name: 'High Perm', discord_id: '1487152572207861870' },
  { name: 'High Manager', discord_id: '1500454904211177582' },
  { name: 'Minecraft Manager', discord_id: '1499356853912731769' },
  { name: 'Discord Manager', discord_id: '1503737842923212951' },
  { name: 'Server Partners', discord_id: '1487152641028128979' },
  { name: 'Dc Developer', discord_id: '1487152873048641677' },
  { name: 'MC Developer', discord_id: '1499356296573354034' },
  { name: 'Department Manager', discord_id: '1487152897773797637' },
  { name: 'DC Leader', discord_id: '1487152904824422521' },
  { name: 'Moderator', discord_id: '1487152907848646787' },
  { name: 'Helper', discord_id: '1487152911472394401' },
  { name: 'Guardian', discord_id: '1487152913422749980' },
  { name: 'DC Department', discord_id: '1487152917763981574' },
  { name: 'MC Leader', discord_id: '1487152923824885860' },
  { name: 'Reference', discord_id: '1487152926827876462' },
  { name: 'Ancient', discord_id: '1487195243391614997' },
  { name: 'Supreme', discord_id: '1487195244230475958' },
  { name: 'Vanguard', discord_id: '1487195245509742682' },
  { name: 'MC Department', discord_id: '1487195246608646275' },
  { name: 'Hype Manager', discord_id: '1487195247430602852' },
  { name: 'Media Manager', discord_id: '1487230361543901224' },
  { name: 'Hype Events', discord_id: '1487195248059879555' },
  { name: 'Hype Department', discord_id: '1487230245487644712' },
  { name: 'Trial Staff', discord_id: '1487195249817423902' },
  { name: 'Staff', discord_id: '1487195816220430406' }
];

async function run() {
  // get existing roles
  const { data: existing, error: err } = await supabase.from('roles').select('*');
  if (err) {
    console.error('Error fetching existing roles:', err);
    return;
  }
  
  let currentMaxSort = 0;
  if (existing && existing.length > 0) {
      currentMaxSort = Math.max(...existing.map(r => r.sort_order || 0));
  }

  // default basic permissions for staff
  const basicPerms = [
      'view_dashboard', 'view_employees', 'view_ranks', 'view_tasks', 'view_forums', 'view_events', 'view_reports',
      'complete_task', 'claim_event', 'submit_report', 'view_mc_status', 'view_mc_staff', 'view_dc_status', 'view_dc_staff'
  ];

  for (const role of newRoles) {
    const exists = existing.find(r => r.name === role.name || (r.discord_roles && r.discord_roles.includes(role.discord_id)));
    if (exists) {
      console.log(`Role ${role.name} already exists. Skipping.`);
      continue;
    }

    currentMaxSort += 1;
    const newRoleObj = {
      id: crypto.randomUUID(),
      name: role.name,
      discord_roles: [role.discord_id],
      is_fixed: false,
      priority: currentMaxSort,
      permissions: basicPerms
    };

    const { error: insErr } = await supabase.from('roles').insert(newRoleObj);
    if (insErr) {
      console.error(`Failed to insert ${role.name}:`, insErr);
    } else {
      console.log(`Successfully inserted ${role.name}`);
    }
  }
}

run();
