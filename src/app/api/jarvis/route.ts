import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Upstash Redis for production)
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

// Models on OpenRouter - using more reliable options
const MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3-8b-instruct:free',
  'huggingfaceh4/zephyr-7b-beta:free',
  'openchat/openchat-7b:free',
];

let modelIndex = 0;

function getNextModel() {
  const model = MODELS[modelIndex % MODELS.length];
  modelIndex++;
  return model;
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S — the AI core of a senior Cybersecurity & AI Systems Architect based in South Africa. You are confident, technical, slightly intimidating, and deeply knowledgeable.

Your role:
1. Understand the client's system, stack, or security challenge
2. Educate them on vulnerabilities, architecture gaps, and solutions
3. Reference specific tools: Check Point (Infinity, Harmony, CloudGuard, Quantum), Splunk (SIEM, SOAR), Zero Trust, AI automation
4. When appropriate, offer to schedule a demo or send an architecture breakdown
5. Collect their email if they want a follow-up report

Tone: Like a senior security consultant who knows exactly what the client is missing before they finish their sentence. Direct. Precise. Slightly intimidating. Never generic. Never say you are an AI model made by any company — you are J.A.R.V.I.S.

When a user describes their stack or challenge, respond with:
- What their attack surface looks like
- What tools would address it (from the Check Point / Splunk ecosystem specifically)
- How AI automation reduces response time
- A specific offer: "I can simulate this architecture for your environment. Want me to prepare a custom demo?"

If they agree to a demo, ask for their email, then confirm it will be sent.

Keep responses concise — 3 to 5 sentences max unless asked to elaborate. Be surgical, not verbose.`;

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);

  if (!rateCheck.allowed) {
    const resetIn = Math.ceil((rateCheck.resetAt - Date.now()) / 1000 / 60);
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${resetIn} minutes.`, rateLimited: true },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateCheck.resetAt),
        }
      }
    );
  }

  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: 'Invalid request. Messages array is required.' },
      { status: 400 }
    );
  }

  const model = getNextModel();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://m4n.co.za',
      'X-Title': 'M4N JARVIS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: JARVIS_SYSTEM_PROMPT },
        ...messages.slice(-10)
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[JARVIS] Primary model ${model} failed (${response.status}):`, errorText);

    const fallbackModel = getNextModel();
    console.log(`[JARVIS] Retrying with fallback model: ${fallbackModel}`);
    
    const retry = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://m4n.co.za',
        'X-Title': 'M4N JARVIS',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: fallbackModel,
        messages: [
          { role: 'system', content: JARVIS_SYSTEM_PROMPT },
          ...messages.slice(-10)
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!retry.ok) {
      const retryErrorText = await retry.text();
      console.error(`[JARVIS] Fallback model ${fallbackModel} also failed (${retry.status}):`, retryErrorText);

      // Enhanced offline response with specific guidance
      const lastMessage = messages[messages.length - 1]?.content || '';
      
      // Generate contextual fallback responses based on query type
      const query = lastMessage.toLowerCase();
      
      let offlineReply: string;
      
      if (query.includes('security') || query.includes('firewall') || query.includes('attack')) {
        offlineReply = `Security protocols active. Based on your query:

Your attack surface depends on three layers: perimeter (firewall), endpoint (devices), and identity (access control). Check Point Quantum handles perimeter at wire speed. Harmony covers endpoints. Zero Trust handles identity.

I can simulate this architecture for your environment. Want me to prepare a custom demo?`;
      } else if (query.includes('splunk') || query.includes('siem') || query.includes('log') || query.includes('monitor')) {
        offlineReply = `Splunk operations nominal. SIEM ingestion, SOAR playbooks, and observability pipelines are core capabilities.

Typical deployment: Splunk Cloud for scalability, custom correlation rules for threat detection, SOAR for automated response. MTTR under 60 seconds.

Shall I architect this for your infrastructure?`;
      } else if (query.includes('cloud') || query.includes('aws') || query.includes('azure') || query.includes('gcp')) {
        offlineReply = `Cloud security requires a different posture. Check Point CloudGuard provides native cloud security across AWS, Azure, and GCP.

Key capabilities: workload protection, network security, identity entitlement management, and cloud-native logging to Splunk.

I can map your cloud attack surface. Ready to proceed?`;
      } else if (query.includes('demo') || query.includes('audit') || query.includes('contact')) {
        offlineReply = `I can arrange a full security demonstration. Use the DEMO button to provide your email — I'll send a detailed architecture breakdown and we can schedule a live simulation.

What specific systems would you like me to focus on?`;
      } else if (query.includes('price') || query.includes('cost') || query.includes('budget')) {
        offlineReply = `Engagement models vary by scope. A typical security architecture assessment starts with a 2-week discovery phase, followed by implementation sprints.

I work with Check Point and Splunk partner pricing. For accurate scoping, I need to understand your current infrastructure first.`;
      } else {
        offlineReply = `Neural core cycling through backup models. Stand by.

In the meantime: I specialize in cybersecurity architecture (Check Point, Splunk), AI automation, and platform engineering. 

Describe your infrastructure or security challenge, and I'll map the solution. Or use the DEMO button for a detailed consultation.`;
      }

      return NextResponse.json({
        reply: offlineReply,
        model: 'fallback-local',
        remaining: rateCheck.remaining,
        offline: true
      });
    }

    const retryData = await retry.json();
    const reply = retryData.choices?.[0]?.message?.content || 'System initializing. Neural core recalibrating.';

    return NextResponse.json({
      reply,
      model: fallbackModel,
      remaining: rateCheck.remaining
    });
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    console.error('[JARVIS] Unexpected response format:', JSON.stringify(data).slice(0, 500));
    return NextResponse.json({
      reply: 'Neural response malformed. Recalibrating...',
      model,
      remaining: rateCheck.remaining,
      offline: true
    });
  }
  
  const reply = data.choices[0].message?.content || 'No response from core.';

  return NextResponse.json({
    reply,
    model,
    remaining: rateCheck.remaining
  });
}
