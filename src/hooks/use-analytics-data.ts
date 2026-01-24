import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format, parseISO } from 'date-fns';

interface AnalyticsEvent {
  id: string;
  event_name: string;
  event_params: Record<string, unknown>;
  pipeline_id: string | null;
  deal_id: string | null;
  source: string | null;
  campaign: string | null;
  created_at: string;
}

export interface AnalyticsSummary {
  totalLeads: number;
  totalDealsCreated: number;
  totalDealsWon: number;
  totalDealsLost: number;
  conversionRate: number;
  totalRevenue: number;
  avgDealValue: number;
  leadsBySource: Array<{ source: string; count: number }>;
  leadsByCampaign: Array<{ campaign: string; count: number }>;
  eventsByDay: Array<{ date: string; leads: number; won: number; lost: number }>;
  funnelData: Array<{ stage: string; count: number; percentage: number }>;
}

export function useAnalyticsData(dateRange: number = 30) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), dateRange).toISOString();
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEvents((data || []).map(e => ({
        ...e,
        event_params: (e.event_params as Record<string, unknown>) || {},
      })));
    } catch (error) {
      console.error('Error fetching analytics events:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const summary = useMemo((): AnalyticsSummary => {
    // Count events by type
    const leadsCaptured = events.filter(e => e.event_name === 'lead_captured');
    const dealsCreated = events.filter(e => e.event_name === 'deal_created');
    const dealsWon = events.filter(e => e.event_name === 'deal_won');
    const dealsLost = events.filter(e => e.event_name === 'deal_lost');

    // Calculate revenue from won deals
    const totalRevenue = dealsWon.reduce((sum, e) => {
      const value = (e.event_params?.deal_value as number) || 0;
      return sum + value;
    }, 0);

    // Leads by source
    const sourceMap = new Map<string, number>();
    leadsCaptured.forEach(e => {
      const source = e.source || 'Direto';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const leadsBySource = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Leads by campaign
    const campaignMap = new Map<string, number>();
    leadsCaptured.forEach(e => {
      if (e.campaign) {
        campaignMap.set(e.campaign, (campaignMap.get(e.campaign) || 0) + 1);
      }
    });
    const leadsByCampaign = Array.from(campaignMap.entries())
      .map(([campaign, count]) => ({ campaign, count }))
      .sort((a, b) => b.count - a.count);

    // Events by day
    const dayMap = new Map<string, { leads: number; won: number; lost: number }>();
    
    // Initialize last N days
    for (let i = 0; i < dateRange; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dayMap.set(date, { leads: 0, won: 0, lost: 0 });
    }

    events.forEach(e => {
      const date = format(parseISO(e.created_at), 'yyyy-MM-dd');
      const existing = dayMap.get(date) || { leads: 0, won: 0, lost: 0 };
      
      if (e.event_name === 'lead_captured') existing.leads++;
      if (e.event_name === 'deal_won') existing.won++;
      if (e.event_name === 'deal_lost') existing.lost++;
      
      dayMap.set(date, existing);
    });

    const eventsByDay = Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Funnel data
    const totalLeads = leadsCaptured.length;
    const totalDealsCreated = dealsCreated.length;
    const totalDealsWon = dealsWon.length;
    
    const funnelData = [
      { stage: 'Leads Capturados', count: totalLeads, percentage: 100 },
      { 
        stage: 'Negócios Criados', 
        count: totalDealsCreated, 
        percentage: totalLeads > 0 ? (totalDealsCreated / totalLeads) * 100 : 0 
      },
      { 
        stage: 'Negócios Ganhos', 
        count: totalDealsWon, 
        percentage: totalLeads > 0 ? (totalDealsWon / totalLeads) * 100 : 0 
      },
    ];

    // Conversion rate
    const conversionRate = totalLeads > 0 ? (totalDealsWon / totalLeads) * 100 : 0;
    
    // Average deal value
    const avgDealValue = totalDealsWon > 0 ? totalRevenue / totalDealsWon : 0;

    return {
      totalLeads,
      totalDealsCreated,
      totalDealsWon,
      totalDealsLost: dealsLost.length,
      conversionRate,
      totalRevenue,
      avgDealValue,
      leadsBySource,
      leadsByCampaign,
      eventsByDay,
      funnelData,
    };
  }, [events, dateRange]);

  return {
    events,
    summary,
    loading,
    refetch: fetchEvents,
  };
}
