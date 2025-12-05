import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  userId: string;
  notification: {
    title: string;
    message: string;
    type: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, notification }: NotificationEmailRequest = await req.json();
    
    // Get user email from profiles
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .single();
    
    if (profileError || !profile?.email) {
      console.error("Failed to get user profile:", profileError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeEmoji = {
      low_stock: "⚠️",
      expiry: "⏰",
      warranty: "📋",
      system: "🔔",
    }[notification.type] || "🔔";

    const emailResponse = await resend.emails.send({
      from: "Home Inventory <onboarding@resend.dev>",
      to: [profile.email],
      subject: `${typeEmoji} ${notification.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .notification-box { background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .notification-title { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 10px; }
            .notification-message { color: #475569; line-height: 1.6; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #14b8a6, #06b6d4); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Home Inventory</h1>
            </div>
            <div class="content">
              <p>Hi ${profile.display_name || "there"},</p>
              <div class="notification-box">
                <div class="notification-title">${typeEmoji} ${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
              </div>
              <p>Stay on top of your inventory management!</p>
              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || '#'}" class="button">View in App</a>
            </div>
            <div class="footer">
              <p>This notification was sent from your Home Inventory app.</p>
              <p>You can manage your notification preferences in the app settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
