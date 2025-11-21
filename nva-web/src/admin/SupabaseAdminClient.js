import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjjihwrhmnlrrxbofvfv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqamlod3JobW5scnJ4Ym9mdmZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI4MTc0MCwiZXhwIjoyMDcwODU3NzQwfQ.XVTG4nJkTMITQds0UDYLqDZzVLpXT0vOQfobmoE0g48';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});
