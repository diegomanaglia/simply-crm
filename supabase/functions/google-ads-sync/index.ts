import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { integration_id, sync_type = "metrics" } = await req.json();

    // Get integration
    const { data: integration, error: integrationError } = await supabase
      .from("google_integrations")
      .select("*")
      .eq("id", integration_id)
      .single();

    if (integrationError || !integration) {
      throw new Error("Integration not found");
    }

    if (integration.status !== "connected") {
      throw new Error("Integration is not connected");
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await supabase
      .from("google_sync_logs")
      .insert({
        integration_id,
        sync_type,
        status: "success",
      })
      .select()
      .single();

    if (syncLogError) {
      throw syncLogError;
    }

    let recordsSynced = 0;
    const errors: Array<{ message: string }> = [];

    // For demo purposes, generate sample metrics data
    // In production, this would call the Google Ads API
    if (sync_type === "metrics" && integration.selected_account_id) {
      try {
        // Generate last 30 days of sample metrics
        const today = new Date();
        const metricsToInsert = [];

        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          // Generate random but realistic metrics
          const impressions = Math.floor(Math.random() * 10000) + 1000;
          const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
          const costMicros = clicks * (Math.floor(Math.random() * 500000) + 100000);
          const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02));

          metricsToInsert.push({
            integration_id,
            campaign_id: integration.selected_account_id,
            date: dateStr,
            impressions,
            clicks,
            cost_micros: costMicros,
            conversions,
            conversion_value: conversions * (Math.random() * 500 + 100),
            ctr: impressions > 0 ? clicks / impressions : 0,
            avg_cpc_micros: clicks > 0 ? costMicros / clicks : 0,
          });
        }

        // Upsert metrics
        const { error: metricsError } = await supabase
          .from("google_ads_metrics")
          .upsert(metricsToInsert, {
            onConflict: "integration_id,campaign_id,date",
          });

        if (metricsError) {
          errors.push({ message: `Metrics insert error: ${metricsError.message}` });
        } else {
          recordsSynced = metricsToInsert.length;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        errors.push({ message: `Metrics sync error: ${errorMessage}` });
      }
    }

    // Update sync log
    await supabase
      .from("google_sync_logs")
      .update({
        records_synced: recordsSynced,
        errors,
        status: errors.length > 0 ? (recordsSynced > 0 ? "partial" : "error") : "success",
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncLog.id);

    return new Response(
      JSON.stringify({
        success: true,
        records_synced: recordsSynced,
        errors: errors.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
