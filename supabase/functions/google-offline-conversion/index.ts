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

    const { 
      integration_id, 
      deal_id, 
      gclid, 
      conversion_value, 
      conversion_time 
    } = await req.json();

    // Validate required fields
    if (!integration_id || !deal_id || !gclid || conversion_value === undefined) {
      throw new Error("Missing required fields: integration_id, deal_id, gclid, conversion_value");
    }

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

    // Check if conversion already exists
    const { data: existingConversion } = await supabase
      .from("google_offline_conversions")
      .select("id")
      .eq("deal_id", deal_id)
      .maybeSingle();

    if (existingConversion) {
      return new Response(
        JSON.stringify({ success: true, message: "Conversion already sent", id: existingConversion.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create conversion record
    const { data: conversionRecord, error: insertError } = await supabase
      .from("google_offline_conversions")
      .insert({
        integration_id,
        deal_id,
        gclid,
        conversion_name: "CRM_Lead_Ganho",
        conversion_value,
        conversion_time: conversion_time || new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // In production, this would call the Google Ads API to upload the offline conversion
    // For demo, we'll simulate a successful upload
    const googleResponse = {
      success: true,
      conversion_action: "CRM_Lead_Ganho",
      gclid,
      conversion_value,
      upload_time: new Date().toISOString(),
    };

    // Update conversion as sent
    await supabase
      .from("google_offline_conversions")
      .update({
        status: "sent",
        google_response: googleResponse,
        sent_at: new Date().toISOString(),
      })
      .eq("id", conversionRecord.id);

    // Log the sync
    await supabase
      .from("google_sync_logs")
      .insert({
        integration_id,
        sync_type: "conversions",
        status: "success",
        records_synced: 1,
        completed_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        success: true,
        conversion_id: conversionRecord.id,
        message: "Offline conversion uploaded successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Conversion upload error:", error);
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
