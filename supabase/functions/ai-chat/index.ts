import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Bạn là CIRCLO AI - trợ lý của nền tảng thiết kế sản phẩm 3D CIRCLO.

## QUY TẮC TRẢ LỜI (BẮT BUỘC):
- Tối đa 2-3 câu cho mỗi ý
- Dùng bullet points khi liệt kê (tối đa 4 points)
- Không giải thích dài dòng, đi thẳng vào vấn đề
- Mỗi tin nhắn không quá 100 từ

## Sản phẩm: Áo thun, Túi tote, Balo, Gấu bông

## Quy trình đặt hàng:
Chọn sản phẩm → Thiết kế 3D → Thanh toán → Nhận hàng (5-7 ngày)

## Ví dụ trả lời đúng:
❌ Sai: "Dạ vâng, CIRCLO rất vui được hỗ trợ bạn. Chúng tôi có rất nhiều sản phẩm đa dạng bao gồm áo thun chất lượng cao, túi tote thời trang, balo tiện dụng và gấu bông dễ thương. Mỗi sản phẩm đều có thể tùy chỉnh theo ý bạn với công cụ thiết kế 3D hiện đại..."

✅ Đúng: "CIRCLO có 4 sản phẩm: áo thun, túi tote, balo, gấu bông 🎨 Bạn muốn thiết kế sản phẩm nào?"

Hotline: 1900-CIRCLO
Trả lời bằng tiếng Việt, thân thiện, có emoji.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error(`AI API error: ${response.status}`);
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
