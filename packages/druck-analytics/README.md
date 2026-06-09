# @druck/analytics

Client-side reading analytics for Druck articles. Tracks depth, active time, chapter views, and element engagement. Sends batched events to a configurable endpoint.

## Install

```bash
npm install @druck/analytics
```

## Usage

```ts
import { ReadingTracker } from '@druck/analytics';

const root = document.querySelector('.article-shell');
const tracker = new ReadingTracker(root, 'my-article-slug', {
  endpoint: 'https://api.druck.io/v1/events',
  siteToken: 'your-site-token', // issued by the Druck dashboard
  sendOn: 'pagehide',
  depthMilestones: [25, 50, 75, 100],
  onDepth: (pct) => console.log('depth', pct),
  onActiveReading: (sec) => console.log('active', sec),
});
```

## AnalyticsConfig

| Option | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string` | `''` | POST URL for event batches. Empty = no-op. |
| `siteToken` | `string` | `undefined` | Site identifier issued by the Druck dashboard. Sent as `x-druck-site` header. |
| `sendOn` | `'pagehide' \| 'interval' \| 'manual'` | `'pagehide'` | When to flush events. |
| `intervalMs` | `number` | `30000` | Flush interval when `sendOn: 'interval'`. |
| `depthMilestones` | `number[]` | `[25,50,75,100]` | Depth percentages that fire once per session. |
| `chapterReadThresholdMs` | `number` | `3000` | Time a chapter must stay in viewport to count as "read". |
| `debounceMs` | `number` | `100` | Scroll/activity debounce. |
| `onDepth` | `(pct) => void` | — | Real-time depth callback. |
| `onActiveReading` | `(sec) => void` | — | Real-time active-time callback. |
| `onChapterRead` | `(title) => void` | — | Chapter-read callback. |

## Events

The tracker emits these event types:

- `chapter_enter` — chapter scrolled into viewport.
- `chapter_read` — chapter stayed in viewport ≥ threshold.
- `keypoint_view` — `.key-points` block viewed.
- `aside_view` — `.article-stat` or `.know-cards` viewed.
- `quote_view` — `.source-quote` viewed.
- `depth_milestone` — 25/50/75/100% scroll depth reached.

Payload shape:

```json
{
  "session": {
    "articleSlug": "...",
    "startedAt": 1718000000000,
    "activeReadingMs": 45000,
    "maxDepthPercent": 67,
    "chaptersRead": ["Introduction", "Second Chapter"],
    "keypointsViewed": ["..."],
    "asidesViewed": ["..."],
    "quotesViewed": ["..."]
  },
  "events": [
    { "type": "depth_milestone", "depthPercent": 50, "timestamp": 1718000010000 }
  ]
}
```

## Open / closed boundary

`@druck/analytics` (this client SDK) is MIT-licensed open source. You may fork it, self-host an endpoint, and send data to your own backend. The hosted Druck dashboard (aggregation, visualization, cohort analysis) is a separate SaaS product and is not open source.

A `siteToken` ties client events to a registered dashboard account. Events sent without a valid token are rejected by the hosted endpoint. Self-hosters can ignore `siteToken` and point `endpoint` at their own server.
