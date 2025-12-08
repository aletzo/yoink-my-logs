# yoink-my-logs

A zero-dependency local log viewer for Node.js. Drop `yoink()` calls in your code and watch them appear in real-time in your browser.

## Installation

```bash
npm install yoink-my-logs
```

## Usage

### 1. Add logs to your code

```javascript
import yoink from "yoink-my-logs"

// Basic logging
yoink("User signed in", { userId: 123 })

// With tags for different log levels
yoink.info("Server started", { port: 3000 })
yoink.success("Payment processed", { amount: 49.99 })
yoink.warn("Rate limit approaching", { current: 95 })
yoink.error("Connection failed", { code: "ETIMEDOUT" })
yoink.debug("Request payload", { body: data })
```

### 2. Start the viewer

```bash
npx yoink
```

Open [http://localhost:7337](http://localhost:7337) to see your logs stream in real-time.

## How It Works

- Logs are stored in `~/.yoink-my-logs/` as daily JSON files (`YYYY-MM-DD.log`)
- The browser UI connects via Server-Sent Events (SSE) for live updates
- When you open the viewer, it shows today's log history and streams new entries as they arrive

## Configuration

Set the port with an environment variable:

```bash
YOINK_PORT=8080 npx yoink
```

Default port is `7337`.

## API

### `yoink(message, data?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `string` | Log message |
| `data` | `any` | Optional data payload (will be JSON serialized) |

### Tagged methods

All methods accept the same `(message, data?)` signature:

| Method | Tag | Color |
|--------|-----|-------|
| `yoink.info()` | INFO | Blue |
| `yoink.success()` | SUCCESS | Green |
| `yoink.warn()` | WARN | Amber |
| `yoink.error()` | ERROR | Red |
| `yoink.debug()` | DEBUG | Purple |

## Demo

Generate sample logs to test the UI:

```bash
npm run demo
```

Or after installing the package:

```bash
npx yoink-demo
```

## Development

```bash
npm test
```

## License

MIT
