import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORY_MAPPING: Record<string, string> = {
  // Food items
  'apple': 'food', 'banana': 'food', 'orange': 'food', 'bread': 'food', 'egg': 'food', 'eggs': 'food',
  'milk': 'beverages', 'yogurt': 'food', 'cheese': 'food', 'meat': 'food', 'fish': 'food',
  'vegetable': 'food', 'fruit': 'food', 'cereal': 'food', 'rice': 'food', 'pasta': 'food',
  'kiwi': 'food', 'tomato': 'food', 'potato': 'food', 'carrot': 'food', 'onion': 'food',
  
  // Beverages
  'water': 'beverages', 'juice': 'beverages', 'soda': 'beverages', 'coffee': 'beverages',
  'tea': 'beverages', 'wine': 'beverages', 'beer': 'beverages', 'bottle': 'beverages',
  
  // Furniture
  'chair': 'furniture', 'table': 'furniture', 'sofa': 'furniture', 'couch': 'furniture',
  'bed': 'furniture', 'desk': 'furniture', 'cabinet': 'furniture', 'shelf': 'furniture',
  'bench': 'furniture', 'diningtable': 'furniture', 'wardrobe': 'furniture', 'bookshelf': 'furniture',
  
  // Electronics
  'laptop': 'electronics', 'computer': 'electronics', 'phone': 'electronics', 'tv': 'electronics',
  'television': 'electronics', 'monitor': 'electronics', 'keyboard': 'electronics', 'mouse': 'electronics',
  'remote': 'electronics', 'tablet': 'electronics', 'camera': 'electronics', 'speaker': 'electronics',
  'headphones': 'electronics', 'charger': 'electronics', 'cable': 'electronics',
  
  // Kitchen
  'pot': 'kitchen', 'pan': 'kitchen', 'knife': 'kitchen', 'fork': 'kitchen', 'spoon': 'kitchen',
  'plate': 'kitchen', 'bowl': 'kitchen', 'cup': 'kitchen', 'glass': 'kitchen', 'mug': 'kitchen',
  'oven': 'kitchen', 'microwave': 'kitchen', 'toaster': 'kitchen', 'blender': 'kitchen',
  'refrigerator': 'kitchen', 'fridge': 'kitchen', 'kettle': 'kitchen',
  
  // Cleaning
  'cleaner': 'cleaning', 'detergent': 'cleaning', 'soap': 'cleaning', 'brush': 'cleaning',
  'mop': 'cleaning', 'broom': 'cleaning', 'vacuum': 'cleaning', 'sponge': 'cleaning',
  
  // Personal care
  'shampoo': 'personal', 'toothbrush': 'personal', 'toothpaste': 'personal', 'razor': 'personal',
  'lotion': 'personal', 'deodorant': 'personal', 'perfume': 'personal',
  
  // Medicine
  'medicine': 'medicine', 'pill': 'medicine', 'vitamin': 'medicine', 'aspirin': 'medicine',
  'bandage': 'medicine', 'thermometer': 'medicine', 'syringe': 'medicine',
  
  // Clothing
  'shirt': 'clothing', 'pants': 'clothing', 'dress': 'clothing', 'shoes': 'clothing',
  'jacket': 'clothing', 'coat': 'clothing', 'hat': 'clothing', 'socks': 'clothing',
  'tie': 'clothing', 'handbag': 'clothing', 'backpack': 'clothing',
  
  // Office
  'pen': 'office', 'pencil': 'office', 'paper': 'office', 'notebook': 'office',
  'stapler': 'office', 'scissors': 'office', 'tape': 'office', 'folder': 'office',
  'book': 'office', 'clock': 'office',
  
  // Documents
  'document': 'documents', 'receipt': 'documents', 'invoice': 'documents', 'contract': 'documents',
};

function classifyItem(itemName: string): string {
  const lowerName = itemName.toLowerCase();
  
  for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
    if (lowerName.includes(keyword)) {
      return category;
    }
  }
  
  return 'other';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, mode, itemName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // If itemName is provided, use AI to get full item details
    if (itemName) {
      console.log(`Getting details for item: ${itemName}`);
      
      const detailsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: `You are a product information assistant. Given an item name, provide detailed information about it.
Return a JSON object with:
{
  "name": "Cleaned/proper product name",
  "category": "food|beverages|cleaning|personal|medicine|electronics|documents|kitchen|furniture|clothing|office|other",
  "unit": "pcs|kg|g|L|ml|box|pack",
  "estimatedPrice": 0.00,
  "expiryDays": null or number (days until typical expiry, null if not applicable),
  "description": "Brief description of the item"
}
Choose the most appropriate category. For furniture/appliances, use longer expiry or null.
Only return valid JSON, no other text.`
            },
            { role: "user", content: `Provide details for: ${itemName}` }
          ],
        }),
      });

      if (!detailsResponse.ok) {
        throw new Error(`AI gateway error: ${detailsResponse.status}`);
      }

      const detailsData = await detailsResponse.json();
      const content = detailsData.choices?.[0]?.message?.content || "{}";
      
      let parsedContent;
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        parsedContent = JSON.parse(jsonStr.trim());
      } catch (e) {
        console.error("Failed to parse AI response:", content);
        parsedContent = {
          name: itemName,
          category: classifyItem(itemName),
          unit: "pcs",
          estimatedPrice: 10.00,
          expiryDays: null,
          description: ""
        };
      }

      return new Response(JSON.stringify({ itemDetails: parsedContent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image scanning mode
    let systemPrompt = "";
    let userPrompt = "";
    const allCategories = "food|beverages|cleaning|personal|medicine|electronics|documents|kitchen|furniture|clothing|office|other";

    if (mode === 'receipt') {
      systemPrompt = `You are an OCR and receipt parsing assistant. Analyze the receipt image and extract all purchased items.
Return a JSON array of items with the following structure:
{
  "items": [
    {
      "name": "Product name",
      "category": "${allCategories}",
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
      "category": "${allCategories}",
      "quantity": 1,
      "unit": "pcs|kg|g|L|ml|box|pack",
      "confidence": 99
    }
  ]
}
Only return valid JSON, no other text.`;
      userPrompt = "Identify this product from the barcode/image:";
    } else {
      systemPrompt = `You are a household item identification assistant. Analyze the image and identify all visible objects/items.
Return a JSON array of items with the following structure:
{
  "items": [
    {
      "name": "Item name (be specific, e.g., 'Wooden Dining Chair' not just 'chair')",
      "category": "${allCategories}",
      "quantity": 1,
      "unit": "pcs|kg|g|L|ml|box|pack",
      "confidence": 85
    }
  ]
}

Category guidelines:
- food: edible items (fruits, vegetables, snacks, etc.)
- beverages: drinks (water, juice, milk, etc.)
- kitchen: cooking items, appliances, utensils
- furniture: chairs, tables, sofas, beds, shelves
- electronics: phones, laptops, TVs, remotes, cables
- cleaning: cleaning products and tools
- personal: personal care items
- medicine: health and medical items
- clothing: clothes, shoes, accessories
- office: stationery, books
- documents: papers, receipts
- other: anything else

Be specific about product names when visible. Count quantities if multiple similar items are shown.
Only return valid JSON, no other text.`;
      userPrompt = "Identify all objects and items in this image:";
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
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      parsedContent = { items: [] };
    }

    // Ensure category is valid for each item
    if (parsedContent.items) {
      parsedContent.items = parsedContent.items.map((item: any) => ({
        ...item,
        category: ['food', 'beverages', 'cleaning', 'personal', 'medicine', 'electronics', 
                   'documents', 'kitchen', 'furniture', 'clothing', 'office', 'other']
          .includes(item.category) ? item.category : classifyItem(item.name)
      }));
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
