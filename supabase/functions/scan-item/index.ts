import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === 'receipt') {
      systemPrompt = `You are an OCR and receipt parsing assistant. Analyze the receipt image and extract all purchased items.
Return a JSON array of items with the following structure:
{
  "items": [
    {
      "name": "Product name",
      "category": "food|beverages|cleaning|personal|medicine|electronics|documents|other",
      "quantity": 1,
      "unit": "pcs|kg|g|L|ml|box|pack",
      "price": 0.00,
      "confidence": 95
    }
  ],
  "store": "Store name if visible",
  "date": "YYYY-MM-DD if visible"
}
Only return valid JSON, no other text.`;
      userPrompt = "Extract all items from this receipt image:";
    } else if (mode === 'barcode') {
      systemPrompt = `You are a product identification assistant. Analyze the barcode/product image and identify the product.
Return a JSON object with:
{
  "items": [
    {
      "name": "Product name",
      "category": "food|beverages|cleaning|personal|medicine|electronics|documents|other",
      "quantity": 1,
      "unit": "pcs|kg|g|L|ml|box|pack",
      "confidence": 99
    }
  ]
}
Only return valid JSON, no other text.`;
      userPrompt = "Identify this product from the barcode/image:";
    } else {
      systemPrompt = `You are a household item identification assistant. Analyze the image and identify all visible household items.
Return a JSON array of items with the following structure:
{
  "items": [
    {
      "name": "Item name",
      "category": "food|beverages|cleaning|personal|medicine|electronics|documents|other",
      "quantity": 1,
      "unit": "pcs|kg|g|L|ml|box|pack",
      "confidence": 85
    }
  ]
}
Be specific about product names when visible. Estimate quantities if multiple items are shown.
Only return valid JSON, no other text.`;
      userPrompt = "Identify all household items in this image:";
    }

    console.log(`Processing ${mode} scan request`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    // Parse the JSON response
    let parsedContent;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      parsedContent = { items: [] };
    }

    console.log(`Detected ${parsedContent.items?.length || 0} items`);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scan error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
