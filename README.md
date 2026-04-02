# 🛡️ ShieldShift
### Parametric Income Protection for E-Commerce Delivery Workers


## The Problem

India has over 12 million gig delivery workers. Most of them wake up every day not knowing if they'll actually earn. Not because they're lazy, but because a sudden curfew, a red-alert rain day, or a local bandh can wipe out an entire day's income in an instant. And there's absolutely nothing they can do about it.

These workers don't need vehicle insurance. They don't need health cover right now. What they need is something much simpler, protection for the wages they lose when the world around them goes wrong, through no fault of their own. That gap is what ShieldShift was built to fill.

## What We Built

ShieldShift is a weekly parametric income-protection platform built exclusively for e-commerce delivery partners working with Amazon and Flipkart. When a verified calamity hits a worker's zone, a flood, a curfew, a pollution emergency, our system detects it, validates it, and pays the worker automatically. No claim form. No phone call. No waiting around for days.

The thing that makes ShieldShift different from anything else out there is what we call **day-part aware payouts**. Most insurance platforms ask one question: did a disruption happen? We ask a better one, when did it happen, relative to this worker's peak earning hours?

A curfew at 7pm costs Ravi ₹900. The exact same curfew at 2pm costs him ₹200. Our AI knows the difference, and our payout reflects that reality. No other platform does this.

## What We Cover

We cover loss of income from two categories of disruption.

On the natural and environmental side, we cover heavy rain and floods when IMD declares an Orange or Red Alert, cyclones and storms, severe heat waves above 45°C, dense fog advisories that make delivery impossible, and severe air pollution when AQI crosses 400 on the CPCB scale.

On the social and civic side, we cover government-declared curfews and Section 144 orders, local bandhs and strikes, authority-ordered zone or market closures, civil unrest that blocks delivery activity, and platform-level suspensions where Amazon or Flipkart halts deliveries in a zone for more than three hours.

We strictly do not cover vehicle damage or repairs, personal accidents, health issues, or anything caused by the worker's own actions. ShieldShift is a focused product, one problem, solved properly.

## Persona & Scenarios

### Meet Ravi

Ravi is 26, works as an Amazon Flex delivery partner in Bengaluru, and puts in 10am to 10pm most days. His real money comes in during the 5pm to 9pm window, the dinner surge, when order density is highest and he can complete back-to-back runs. He earns between ₹4,500 and ₹6,000 a week, paid out to his Google Pay every Friday.

**Scenario A: The Curfew Evening**

It's a Tuesday. At 5pm, just as Ravi is about to head out for his peak shift, Section 144 is declared in his zone due to a local protest. He can't leave home. His entire peak window, roughly ₹900 worth of earnings, is gone. There's no one to call, no form to fill, no claim to raise.

With ShieldShift, the curfew order is detected through our civic feed the moment it's issued. His zone is matched, his active policy is confirmed, and his income loss is calculated against his personal hourly baseline. Within 90 seconds, ₹850 is credited to his UPI wallet. Ravi never touched the app.

**Scenario B: The Rain Week**

IMD declares a Red Alert across Ravi's district for three consecutive days. Orders drop by 60%. He earns ₹1,200 for those three days instead of his usual ₹4,800. That's a ₹3,600 shortfall, nearly his entire week's income.

With ShieldShift, the Red Alert fires a parametric trigger on Day 1. The AI calculates the gap against his earnings baseline, applies his coverage ratio, and processes a payout. The money is in his wallet by Day 2, with no action required from him at all.

## How It Works

ShieldShift runs across four phases. The worker is only involved in Phase 1, everything after that is fully automated.

**Phase 1: Onboarding**

The worker downloads the PWA, verifies via Phone and OTP, links their UPI wallet (Google Pay or PhonePe), selects their delivery zone by pin code, and activates their weekly plan. The whole thing takes under three minutes. Every Sunday, they get a notification to confirm the next week's renewal. That's the only recurring action they ever need to take.

**Phase 2: Continuous AI Monitoring**

Three live data streams run 24x7 in the background, our weather feed (IMD and OpenWeatherMap), our AQI feed (CPCB), and our civic events feed (NewsAPI and government sources). These are aggregated into a per-zone risk score that refreshes every 15 minutes. That score feeds into our XGBoost income loss predictor, which then goes through an Isolation Forest fraud check, and finally hits a threshold gate. If the predicted income drop is 20% or more, the trigger fires.

```
[Weather API]  +  [AQI API: CPCB]  +  [Civic Events Feed]
 Rain, heat,       Pollution data       Curfews, bandh,
 fog, floods                            zone closures
       |                  |                    |
       +-----------------+--------------------+
                          |
                  [Zone Risk Score]
                 Updated every 15 min
                          |
             [XGBoost Income Loss Predictor]
                          |
               [Isolation Forest Fraud Check]
                          |
            [Threshold Gate: Drop 20% or more? FIRE]
```

Our four trigger types are:

| Code | Event | Source |
|---|---|---|
| T1 | Rain / flood / storm / heat wave / fog | IMD and OpenWeatherMap |
| T2 | Severe air pollution AQI 400+ | CPCB AQI API |
| T3 | Curfew / bandh / zone closure / unrest | NewsAPI and civic feed |
| T4 | Platform delivery suspension in zone | Amazon / Flipkart API (mock) |

**Phase 3: Auto Trigger and Claim**

The moment a trigger clears all checks, a claim is auto-generated with zero input from the worker. A push notification goes out via Firebase FCM to their phone within 5 seconds. They find out their payout is on the way before they've even thought about it.

```
[Trigger Activated: T1 / T2 / T3 / T4]
                |
                v
   [Claim Auto-Generated: No Worker Action]
                |
                v
  [Push Notification via Firebase FCM to Worker]
          (within 5 seconds of trigger)
```

**Phase 4: Instant UPI Payout**

Payout is calculated as Loss multiplied by Coverage Ratio. The instruction goes to Razorpay's UPI Payout API, gets credited to the worker's Google Pay or PhonePe wallet, and a confirmation notification is sent, all within 90 seconds of the trigger firing.

```
[Payout = Loss x Coverage Ratio]
                |
                v
     [Razorpay UPI Payout API]
                |
                v
  [Credited to GPay / PhonePe wallet]
                |
                v
    [Confirmation push notification]
     Total time: under 90 seconds
```

## Weekly Premium Model

We built ShieldShift on a weekly pricing model because gig workers don't think in months. A ₹500/month premium feels abstract and disconnected from their earnings cycle. ₹25 to ₹80 a week, deducted right after their weekly platform payout, is something they can actually feel and understand.

Premiums aren't flat. They're recalculated every Sunday by our AI based on five factors: the worker's city and pin code zone (flood-prone or curfew-heavy areas carry higher risk), the disruption history in that zone over the past 12 months, the worker's declared peak earning hours, the upcoming week's seasonal and weather outlook, and the worker's tenure on the platform (more history means a more accurate baseline and fairer pricing).

| Risk Level | Weekly Premium | Max Weekly Payout |
|---|---|---|
| Low: stable zone, dry season | ₹25 | ₹1,000 |
| Medium: metro city, monsoon | ₹45 | ₹2,500 |
| High: flood-prone, curfew history | ₹80 | ₹4,500 |

Every worker sees their upcoming premium on Sunday before confirming. No surprises.

## AI/ML Integration

**Dynamic Premium Calculation** uses an XGBoost regression model trained on zone risk scores, historical disruption data, worker peak hours, seasonal indices, and platform activity. It outputs a weekly premium amount and a risk score between 0 and 100. This runs as a rule-based calculator with mock training data first, then transitions to a live model trained on real onboarding data.

**Income Loss Prediction** uses linear regression on each worker's personal earnings baseline. The key innovation here is the day-part weighting system. A worker who earns 70% of their income between 5pm and 9pm receives a 1.4x payout multiplier when a trigger fires in that window, versus 0.6x if it fires in the middle of the afternoon. The payout matches the actual loss, not a flat average.

**Fraud Detection** uses an Isolation Forest for unsupervised anomaly detection. Every claim is validated through five checks: a GPS location match between the worker's last known ping and their declared zone, an activity check confirming they were active on platform within 2 hours of the trigger, a duplicate prevention rule (one payout per trigger per worker per zone), a velocity check where more than 2 payouts in 7 days triggers manual review, and a pattern check that flags coordinated fraud if 90% or more of workers in the same zone claim simultaneously.

## Platform Choice: Mobile-First PWA

We chose a Progressive Web App over a native mobile app for clear practical reasons. Delivery workers on budget Android devices don't want to download another app. A PWA installs from a single browser link with one tap, works on low-end hardware with patchy internet, supports WhatsApp-based onboarding where workers share a link in their delivery group chats, and gives us a single codebase for both web and mobile which is critical when building fast. It also supports offline caching for key screens, so workers can check their policy status even without a strong connection.

A native app would have meant Play Store approval delays, a download barrier, and double the development time. PWA removes all of that friction.

## Integrations

We're keeping Phase 1 lean by using free tiers and mock APIs wherever live data isn't critical yet.

| Service | Provider | Phase 1 Approach |
|---|---|---|
| Weather and rain alerts | IMD and OpenWeatherMap | Free tier |
| Air quality | CPCB AQI API | Free tier |
| Civic disruptions | NewsAPI.org | Free tier |
| Flood and disaster alerts | NDMA public data | Mock responses |
| Platform delivery data | Amazon / Flipkart | Simulated mock API |
| UPI payouts | Razorpay Payouts API | Sandbox mode |
| Worker authentication | Aadhaar eKYC | Mock verification |
| Push notifications | Firebase FCM | Free tier |
| SMS fallback | MSG91 / Twilio | Free trial |

## Analytics Dashboard

Workers get a clean mobile view showing their active policy status, the premium paid this week, their full claim history with payout timelines, their zone's current risk level, and their personal earnings baseline as the AI sees it.

On the admin side, the insurer dashboard shows a live map of active trigger events across zones, a claims funnel from trigger to payout, a fraud flags queue for manual review, the weekly premium pool versus payout liability, and a city-level risk heatmap across India.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js PWA and Tailwind CSS |
| Backend | Node.js and Express.js |
| Database | PostgreSQL |
| ML / AI | Python with XGBoost and scikit-learn, served via FastAPI |
| Real-time events | Socket.io |
| Payments | Razorpay Sandbox |
| Notifications | Firebase FCM |
| Hosting | Vercel (frontend) and Render (backend) |
| Version control | GitHub |

## Development Plan

**Phase 1: Ideation and Foundation**
Research, persona finalization, system design, Figma prototype, onboarding flow, basic premium calculator, mock trigger engine, README and demo video.

**Phase 2: Automation and Protection**
Full registration and policy management, dynamic ML-based premium calculation, claims management, 3 to 5 live parametric triggers via mock APIs, zero-touch automated claim flow.

**Phase 3: Scale and Optimise**
Advanced fraud detection, simulated instant UPI payouts, intelligent worker and admin dashboard, final 5-minute demo video, and pitch deck.

## Adversarial Defense and Anti-Spoofing Strategy

*500 fake workers. Spoofed GPS. Coordinated claims. The Market Crash is exactly the kind of attack ShieldShift was built to survive. Here's how we fight back.*

**How do we spot a fake worker from a genuinely stranded one?**

A real worker leaves a trail. A fake one leaves a pattern.

When a calamity hits, a genuine worker's phone tells a consistent story. They've been pinging from their registered zone for at least 6 of the last 8 hours, they completed at least one delivery within 2 hours of the trigger, their hourly earnings baseline matches their historical average within a 15% variance, and their UPI traces back to a verified Aadhaar-linked identity. Everything lines up because everything is real.

A fraudster's phone tells a different story. GPS suddenly appears in a zone they've never delivered in across their last 30 days of activity. Zero platform orders in the 4 hours before the claim. Account created within the last 14 days, suspiciously close to a forecasted calamity. Declared peak hours don't match any historical earning pattern. Registered zone doesn't match claim location by more than 3 pin codes.

Every claim on ShieldShift runs a **5-point legitimacy check** before a single rupee moves, zone presence history, platform activity recency, account age, earnings baseline variance, and Aadhaar-linked UPI verification. You can spoof a location. You cannot spoof 30 days of delivery history.

**What data catches a coordinated fraud ring?**

Fraud rings are greedy. And greed creates patterns.

When 500 real workers get hit by a curfew, claims arrive spread across 25 to 40 minutes, from locations distributed naturally across the affected zone, with payout amounts varying by 30 to 40% because every worker has a different earnings baseline. Real disruptions produce messy, human, distributed data.

When 500 fraudsters hit the system simultaneously, the data looks completely different. Claims spike within a 60-second window. GPS coordinates cluster within a 200-metre radius, too many phones in one spot. Payout amounts vary by less than 5% because fabricated baselines are hard to randomise convincingly. Multiple UPI IDs resolve to 2 or 3 parent bank accounts. 80% of the accounts were created within the same 7-day window.

Our **Isolation Forest anomaly detector** runs continuously across every claim batch. The moment more than 60% of a batch shares 3 or more of these signals simultaneously, time clustering under 90 seconds, GPS radius under 500 metres, baseline variance under 8%, UPI account overlap, or coordinated account creation, the entire batch is frozen instantly. No partial payouts. No exceptions. One ring. Caught. Zero rupees lost.

**How do we flag bad actors without punishing honest workers?**

This is the hardest problem in fraud detection and the most important one to get right. The answer is **tiered response, not binary blocking.**

**Tier 1: Green light.** All 5 checks pass cleanly. Payout fires in under 90 seconds. Zero friction for honest workers. This is the experience 95% of genuine workers will always have.

**Tier 2: Soft hold.** 1 or 2 signals look unusual but aren't conclusive. Payout holds for a maximum of 2 hours while the system runs a deeper cross-check across platform activity logs, 30-day zone presence history, and device fingerprint consistency. If it clears, money goes through immediately. Worker gets a transparent notification explaining the short delay. No penalty. No rejection. No permanent record.

**Tier 3: Human review.** 3 or more fraud signals fire simultaneously. Claim is frozen and escalated with a full auto-generated evidence report covering GPS trace, activity log, account history, and UPI audit, to a human reviewer. Worker is notified within 5 minutes, told exactly why their claim is under review, given a 4-hour resolution window, and offered a direct helpline. Genuine worker? Paid in full with a ₹10 inconvenience credit. Confirmed fraudster? Permanently blacklisted across all zones with a report filed to the partner platform.

The principle we refuse to compromise on: **a delayed payout for an honest worker is recoverable. A wrongful rejection destroys trust forever.**

ShieldShift doesn't just detect fraud. It does it without turning every genuine worker into a suspect. That's not just good ethics. In a product built on trust, it's the only architecture that actually works.

## Why ShieldShift

We didn't try to build everything. We picked one problem, gig workers losing income to calamities they can't control, and we solved it completely. No manual claims. No flat payouts that ignore when the disruption actually happened. No monthly premiums that don't fit how these workers live.

The day-part aware payout model is something no one else is doing. The zero-friction claim experience is what these workers deserve. And the weekly pricing model is the only one that actually makes sense for this population.

Parametric insurance is the future of gig worker protection. ShieldShift is already there.

*ShieldShift — Because your income deserves a shield.* 🛡️
