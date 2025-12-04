-- Fix RLS for sponsor tables
-- Security advisor detected that RLS policies exist but RLS is not enabled

ALTER TABLE sponsorship_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_impact_stats ENABLE ROW LEVEL SECURITY;
