import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  displayName?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName }: WelcomeEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Home Inventory <onboarding@resend.dev>",
      to: [email],
      subject: "🎉 Welcome to Home Inventory!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .header p { color: rgba(255,255,255,0.9); margin-top: 10px; }
            .content { padding: 40px; }
            .feature { display: flex; align-items: flex-start; margin: 20px 0; }
            .feature-icon { font-size: 24px; margin-right: 15px; }
            .feature-text h3 { margin: 0 0 5px 0; color: #0f172a; }
            .feature-text p { margin: 0; color: #64748b; font-size: 14px; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #14b8a6, #06b6d4); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Welcome to Home Inventory!</h1>
              <p>Your smart home management solution</p>
            </div>
            <div class="content">
              <p>Hi ${displayName || "there"},</p>
              <p>Thank you for joining Home Inventory! We're excited to help you organize and manage your household items efficiently.</p>
              
              <h2 style="margin-top: 30px;">Here's what you can do:</h2>
              
              <div class="feature">
                <span class="feature-icon">📷</span>
                <div class="feature-text">
                  <h3>AI-Powered Scanning</h3>
                  <p>Take photos of items and let AI identify and categorize them automatically</p>
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">⚠️</span>
                <div class="feature-text">
                  <h3>Smart Alerts</h3>
                  <p>Get notified when items are running low or about to expire</p>
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">👨‍👩‍👧‍👦</span>
                <div class="feature-text">
                  <h3>Family Sharing</h3>
                  <p>Share your inventory with family members and manage together</p>
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">📊</span>
                <div class="feature-text">
                  <h3>Analytics Dashboard</h3>
                  <p>Track spending, see trends, and get AI-powered insights</p>
                </div>
              </div>
              
              <p style="margin-top: 30px;">Please check your email for a confirmation link to activate your account.</p>
              
              <p>Happy organizing! 🏠</p>
            </div>
            <div class="footer">
              <p>© 2024 Home Inventory. All rights reserved.</p>
              <p>This email was sent because you created an account on Home Inventory.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
