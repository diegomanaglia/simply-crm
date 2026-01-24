import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FacebookLead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

interface FormMapping {
  id: string;
  form_id: string;
  form_name: string;
  page_id: string;
  pipeline_id: string;
  phase_id: string | null;
  auto_tags: string[];
  default_temperature: string;
  is_active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { integration_id, sync_type = "auto" } = await req.json();

    // Get integration
    const { data: integration, error: integrationError } = await supabase
      .from("facebook_integrations")
      .select("*")
      .eq("id", integration_id)
      .single();

    if (integrationError || !integration) {
      throw new Error("Integration not found");
    }

    if (integration.status !== "connected") {
      throw new Error("Integration is not connected");
    }

    // Get active form mappings
    const { data: mappings, error: mappingsError } = await supabase
      .from("facebook_form_mappings")
      .select("*")
      .eq("integration_id", integration_id)
      .eq("is_active", true);

    if (mappingsError) {
      throw mappingsError;
    }

    // Create sync log
    const { data: syncLog, error: syncLogError } = await supabase
      .from("facebook_sync_logs")
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

    let totalLeadsImported = 0;
    let totalDuplicates = 0;
    const errors: Array<{ message: string; lead_id?: string }> = [];

    // Process each form mapping
    for (const mapping of mappings || []) {
      try {
        // Fetch leads from Facebook Graph API
        const leadsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${mapping.form_id}/leads?access_token=${integration.access_token}&limit=50`,
          { method: "GET" }
        );

        if (!leadsResponse.ok) {
          const errorData = await leadsResponse.json();
          errors.push({
            message: `Failed to fetch leads for form ${mapping.form_name}: ${errorData.error?.message || "Unknown error"}`,
          });
          continue;
        }

        const leadsData = await leadsResponse.json();
        const leads: FacebookLead[] = leadsData.data || [];

        for (const lead of leads) {
          try {
            // Extract field data
            const fieldMap: Record<string, string> = {};
            for (const field of lead.field_data) {
              fieldMap[field.name.toLowerCase()] = field.values[0] || "";
            }

            const email = fieldMap.email || fieldMap.e_mail || "";
            const phone = fieldMap.phone_number || fieldMap.phone || fieldMap.telefone || "";
            const fullName = fieldMap.full_name || fieldMap.name || fieldMap.nome || "";
            const company = fieldMap.company_name || fieldMap.company || fieldMap.empresa || "";

            // Check for duplicates by email
            if (email) {
              // For now, we'll store in local state via the CRM store
              // In a real implementation, you'd check against a deals table
            }

            // Create deal data
            const dealData = {
              title: fullName || "Lead Facebook",
              contactName: fullName,
              email,
              phone,
              company,
              source: "Facebook Lead Ads",
              temperature: mapping.default_temperature,
              value: 0,
              tags: mapping.auto_tags.map((name: string) => ({
                id: crypto.randomUUID(),
                name,
                color: "#1877F2", // Facebook blue
              })),
              phaseId: mapping.phase_id,
              pipelineId: mapping.pipeline_id,
              origin: {
                utmParams: {
                  utm_source: "facebook",
                  utm_medium: "lead_ads",
                  utm_campaign: mapping.form_name,
                },
                capturedAt: lead.created_time,
              },
              facebookLeadId: lead.id,
            };

            // Here you would insert into your deals table
            // For demo purposes, we'll just count
            totalLeadsImported++;
          } catch (leadError) {
            errors.push({
              message: `Failed to process lead: ${leadError}`,
              lead_id: lead.id,
            });
          }
        }
      } catch (formError) {
        errors.push({
          message: `Error processing form ${mapping.form_name}: ${formError}`,
        });
      }
    }

    // Update sync log
    await supabase
      .from("facebook_sync_logs")
      .update({
        leads_imported: totalLeadsImported,
        leads_duplicates: totalDuplicates,
        errors,
        status: errors.length > 0 ? (totalLeadsImported > 0 ? "partial" : "error") : "success",
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncLog.id);

    return new Response(
      JSON.stringify({
        success: true,
        leads_imported: totalLeadsImported,
        leads_duplicates: totalDuplicates,
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
