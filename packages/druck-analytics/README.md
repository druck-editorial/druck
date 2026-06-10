# @druck-editorial/analytics

Local-first reading analytics for druck pages. Tracks scroll depth, active reading time, and chapter engagement. Nothing leaves the page unless you configure an endpoint.

## Install

```bash
pnpm add @druck-editorial/analytics
```

## Usage

```ts
import { ReadingTracker } from '@druck-editorial/analytics';

const root = document.querySelector('.article-shell') as HTMLElement;
const tracker = new ReadingTracker(root, 'infrastructure-gap-2025', {
  endpoint: 'https://analytics.example.com/events',
  siteToken: 'your-site-token',
  sendOn: 'pagehide',
  depthMilestones: [25, 50, 75, 100],
  onDepth: (pct) => console.log('depth', pct),
  onActiveReading: (sec) => console.log('active', sec),
  onChapterRead: (title) => console.log('read:', title),
});
```

The first argument is the article root element. The second is the article slug used to key the session. The config is optional.

## AnalyticsConfig

| Field | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string` | `''` | URL to POST session data to. When empty, data stays local. |
| `siteToken` | `string` | — | Sent as `x-druck-site` header. Optional for self-hosted endpoints. |
| `sendOn` | `'pagehide' \| 'interval' \| 'manual'` | `'pagehide'` | When to flush the session. |
| `intervalMs` | `number` | `30000` | Flush interval when `sendOn` is `'interval'`. |
| `depthMilestones` | `number[]` | `[25, 50, 75, 100]` | Scroll depth percentages that fire `onDepth` once per session. |
| `chapterReadThresholdMs` | `number` | `3000` | Time a chapter must stay in viewport before it counts as read. |
| `debounceMs` | `number` | `100` | Scroll and activity debounce window. |
| `onDepth` | `(pct: number) => void` | — | Called when a depth milestone is reached. |
| `onActiveReading` | `(sec: number) => void` | — | Called each active-reading tick (1s). |
| `onChapterRead` | `(title: string) => void` | — | Called when a chapter passes the read threshold. |

## Public methods

```ts
tracker.getSession()   // returns Readonly<ReadingSession>
tracker.getEvents()    // returns ReadonlyArray<ReadingEvent>
tracker.destroy()      // disconnects observers, clears timers, flushes pending events
```

## Event types

- `chapter_enter` — chapter scrolled into viewport.
- `chapter_read` — chapter stayed in viewport for at least `chapterReadThresholdMs`.
- `keypoint_view` — key-points block viewed.
- `aside_view` — stat aside or know-cards block viewed.
- `quote_view` — source quote viewed.
- `depth_milestone` — scroll depth milestone reached.

## Data stays local by default

When `endpoint` is empty no network request is made. Session data is available at any time via `tracker.getSession()`. Use `sendOn: 'manual'` and `tracker.destroy()` to control when the flush happens.

## Open / closed boundary

This client SDK is MIT-licensed. You can fork it, self-host an endpoint, and send data to your own backend. The hosted Druck dashboard (aggregation, visualization, cohort analysis) is a separate product and is not open source. A `siteToken` ties client events to a registered dashboard account. Self-hosters can omit it and point `endpoint` at their own server.
