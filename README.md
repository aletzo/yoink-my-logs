# yoink-my-logs

A zero-dependency local log viewer for Node.js. Drop `yoink()` calls in your code and watch them appear in real-time in your browser.

<img src="assets/yoink-screen-shot-main.jpg" width="700" alt="Main UI">

<details>
<summary>More screenshots</summary>

## Filter by Tag

<img src="assets/yoink-screen-shot-filter-by-tag.jpg" width="700" alt="Filter by tag">

## Search

<img src="assets/yoink-screen-shot-search.jpg" width="700" alt="Search">

## Light Theme

<img src="assets/yoink-screen-shot-light-theme.jpg" width="700" alt="Light theme">

</details>

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

## Browser / Frontend Usage

You can also call `yoink()` from your frontend code. Logs are sent to the yoink server via HTTP.

### Option A: ES Module Import

```javascript
import yoink from "yoink-my-logs/browser"

yoink("page loaded", { url: location.href })
yoink.info("user action", { type: "click" })
```

### Option B: Script Tag

Add the script tag to your HTML (served by the yoink server):

```html
<script src="http://localhost:7337/yoink.js"></script>
<script>
  yoink("button clicked", { id: "submit" })
  yoink.error("something broke", { code: 500 })
</script>
```

### Custom Port or Host

If the yoink server is running on a non-default port or a different host:

```javascript
import yoink from "yoink-my-logs/browser"

// Custom port
yoink.init({ port: 8080 })

// Custom host (e.g., for LAN access from mobile)
yoink.init({ host: "192.168.1.50" })

// Both
yoink.init({ host: "192.168.1.50", port: 8080 })

yoink("hello from mobile")
```

The `init()` call is optional — if you don't call it, it defaults to `localhost:7337`.

## How It Works

- Logs are stored in `~/.yoink-my-logs/` as daily JSON files (`YYYY-MM-DD.log`)
- The browser UI connects via Server-Sent Events (SSE) for live updates
- When you open the viewer, it shows today's log history and streams new entries as they arrive

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `YOINK_PORT` | `7337` | Port for the web UI |
| `YOINK_LOG_DIR` | `~/.yoink-my-logs` | Directory where log files are stored |

### Examples

```bash
# Custom port
YOINK_PORT=8080 npx yoink

# Custom log directory
YOINK_LOG_DIR=/tmp/my-logs npx yoink

# Both
YOINK_PORT=8080 YOINK_LOG_DIR=/var/log/yoink npx yoink
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

### Browser module

The browser module (`yoink-my-logs/browser`) has the same API as above, plus:

#### `yoink.init(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | `localhost` | Hostname or IP address of the yoink server |
| `port` | `number` | `7337` | Port number of the yoink server |

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
