# Demo Project

This directory contains example projects to help test and demonstrate `yoink-my-logs`.

## Quick Start

1. **Start the yoink server** (in one terminal):

   ```bash
   npm run start
   # or: npx yoink
   ```

2. **Run the Node.js demo** (in another terminal):

   ```bash
   node demo/node-demo.js
   ```

3. **Run the browser demo** (in another terminal):
   ```bash
   npm run demo:browser
   ```
   This will start a local server and open the demo in your browser.

## What's Included

- **`node-demo.js`** - A Node.js application demonstrating various yoink logging features
- **`browser-demo.html`** - A standalone HTML page demonstrating browser-based logging
- **`continuous-demo.js`** - A continuous logging demo that runs until stopped (useful for testing live updates)

## Running the Demos

### Node.js Demo

```bash
node demo/node-demo.js
```

This will generate a variety of log entries with different tags, data structures, and messages.

### Browser Demo

Run the browser demo with:

```bash
npm run demo:browser
```

This will start a local server on port 8080 and automatically open the demo in your browser. Make sure the yoink server is running first (on port 7337).

### Continuous Demo

```bash
node demo/continuous-demo.js
```

This will continuously generate logs every few seconds, useful for testing the live streaming feature.
