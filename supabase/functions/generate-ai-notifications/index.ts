import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  );
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function sendNotificationEmail(email: string, displayName: string, title: string, message: string, type: string) {
  if (!RESEND_API_KEY) return;
  const resend = new Resend(RESEND_API_KEY);
  
  const typeEmoji = { low_stock: "⚠️", expiry: "⏰", warranty: "📋", system: "🔔" }[type] || "🔔";
  
  await resend.emails.send({
    from: "Home Inventory <onboarding@resend.dev>",
    to: [email],
    subject: `${typeEmoji} ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">📦 Home Inventory</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p>Hi ${displayName || "there"},</p>
          <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>${typeEmoji} ${title}</strong>
            <p style="color: #475569; margin-top: 10px;">${message}</p>
          </div>
        </div>
      </div>
    `,
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, householdId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user profile and settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .single();
    
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    // Get user's items
    const { data: items } = await supabase
      .from("items")
      .select("*")
      .eq("household_id", householdId);
    
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: "No items to analyze" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications: any[] = [];
    const today = new Date();
    
    // Check for low stock items
    const lowStockItems = items.filter(item => 
      item.quantity !== null && 
      item.low_stock_threshold !== null && 
      item.quantity <= item.low_stock_threshold
    );
    
    // Check for expiring items (within 7 days)
    const expiringItems = items.filter(item => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });

    // Generate AI-powered notifications using Gemini
    if (lowStockItems.length > 0 && settings?.low_stock_alerts !== false) {
      const itemsList = lowStockItems.map(i => `${i.name} (${i.quantity} ${i.unit || 'pcs'} remaining)`).join(", ");
      
      const prompt = `Generate a helpful, friendly notification message for a home inventory app. The user has the following items running low on stock: ${itemsList}. 
      Write a concise, actionable message (max 100 words) that:
      1. Lists the items that need restocking
      2. Suggests they add these to their shopping list
      3. Is warm and helpful in tone
      Do not use markdown, just plain text.`;
      
      const aiMessage = await callGemini(prompt);
      
      for (const item of lowStockItems) {
        const notification = {
          user_id: userId,
          household_id: householdId,
          item_id: item.id,
          type: "low_stock",
          title: `Low Stock: ${item.name}`,
          message: aiMessage || `${item.name} is running low with only ${item.quantity} ${item.unit || 'pcs'} remaining. Consider restocking soon!`,
          action_url: "/inventory",
        };
        
        // Check if similar notification was sent recently
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("item_id", item.id)
          .eq("type", "low_stock")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .single();
        
        if (!existing) {
          const { data: inserted } = await supabase.from("notifications").insert(notification).select().single();
          if (inserted) {
            notifications.push(inserted);
            // Send email notification
            if (settings?.email_notifications !== false && profile?.email) {
              await sendNotificationEmail(profile.email, profile.display_name, notification.title, notification.message, "low_stock");
            }
          }
        }
      }
    }

    // Generate expiry notifications
    if (expiringItems.length > 0 && settings?.expiry_alerts !== false) {
      for (const item of expiringItems) {
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        const prompt = `Generate a brief, helpful notification about an expiring item for a home inventory app.
        Item: ${item.name}
        Days until expiry: ${daysUntilExpiry}
        Category: ${item.category}
        
        Write a concise message (max 50 words) that:
        1. Mentions when it expires
        2. Suggests what to do (use it soon, check if still good, etc.)
        Be friendly and helpful. No markdown.`;
        
        const aiMessage = await callGemini(prompt);
        
        const notification = {
          user_id: userId,
          household_id: householdId,
          item_id: item.id,
          type: "expiry",
          title: daysUntilExpiry === 0 ? `${item.name} Expires Today!` : `${item.name} Expires in ${daysUntilExpiry} Day${daysUntilExpiry > 1 ? 's' : ''}`,
          message: aiMessage || `Your ${item.name} expires on ${expiryDate.toLocaleDateString()}. Consider using it soon!`,
          action_url: "/inventory",
        };
        
        // Check if similar notification was sent recently
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("item_id", item.id)
          .eq("type", "expiry")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .single();
        
        if (!existing) {
          const { data: inserted } = await supabase.from("notifications").insert(notification).select().single();
          if (inserted) {
            notifications.push(inserted);
            if (settings?.email_notifications !== false && profile?.email) {
              await sendNotificationEmail(profile.email, profile.display_name, notification.title, notification.message, "expiry");
            }
          }
        }
      }
    }

    // Generate smart suggestions periodically
    if (items.length > 5) {
      const itemsSummary = items.slice(0, 20).map(i => `${i.name} (${i.category}, qty: ${i.quantity})`).join("; ");
      
      const prompt = `Based on this home inventory: ${itemsSummary}
      
      Generate ONE smart, actionable suggestion for the user. Examples:
      - Suggest organizing items by location
      - Recommend checking items that might need attention
      - Tip for better inventory management
      
      Keep it under 60 words, friendly and helpful. No markdown.`;
      
      const aiSuggestion = await callGemini(prompt);
      
      if (aiSuggestion && aiSuggestion.length > 20) {
        // Only send suggestion once per week
        const { data: existingSuggestion } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "system")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);
        
        if (!existingSuggestion || existingSuggestion.length === 0) {
          const notification = {
            user_id: userId,
            household_id: householdId,
            type: "system",
            title: "💡 Smart Suggestion",
            message: aiSuggestion,
            action_url: "/inventory",
          };
          
          const { data: inserted } = await supabase.from("notifications").insert(notification).select().single();
          if (inserted) notifications.push(inserted);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      notifications_created: notifications.length,
      notifications 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating notifications:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
