# Hyperliquid Order Book Web Client

A professional, real-time web-based client for viewing Hyperliquid perpetual futures order books and trade feeds. Built with React, TypeScript, and WebSocket for low-latency live market data visualization.

## Features

- **Real-time L2 Order Book** - Live bid/ask levels with visual depth bars
- **Recent Trades Feed** - Streaming executed trades with side indicators
- **Live Configuration Panel** - Adjust orderbook settings in real-time:
  - Coin selection (BTC, ETH, SOL, etc.)
  - Significant figures (2-5) for price bucketing
  - Number of levels (1-100) per side
  - Mantissa rounding (2 or 5, when nSigFigs = 5)
- **Professional UI** - Dark theme inspired by GitHub and trading platforms
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Connection Management** - Automatic reconnection with exponential backoff
- **Performance Optimized** - Memoized components, efficient state management

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **WebSocket API** for real-time data
- **CSS Modules** for scoped styling
- **React Context** for state management
- **Custom Hooks** for business logic separation

## Prerequisites

- Node.js 14.x or higher
- WebSocket server running at `ws://localhost:8000/ws` (see [main README](../../README.md))
- Modern browser with WebSocket support

## Installation

```bash
cd /root/order_book_server/clients/orderbook-web
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` to configure the WebSocket URL:

```env
VITE_WS_URL=ws://localhost:8000/ws
```

## Usage

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build the application for production:

```bash
npm run build
```

The optimized files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (if configured)

## UI Components

### Header
- Displays coin symbol and market type
- Shows mid price, spread, and last update time
- Updates in real-time with orderbook data

### Configuration Panel
- **Coin Selector** - Choose from available coins (BTC, ETH, SOL, etc.)
- **Significant Figures** - Control price bucketing (2-5)
  - Lower = more aggregation (e.g., $100 buckets)
  - Higher = more precision (e.g., $10 buckets)
  - Undefined = full precision (no bucketing)
- **Mantissa** - Rounding preference (2 or 5) when nSigFigs = 5
- **Number of Levels** - How many price levels to display per side (1-100)
- Collapsible panel for clean interface
- Real-time preview of current settings
- Apply button to update subscriptions

### Order Book
- **Bids** (green) - Buy orders, best bid at top
- **Asks** (red) - Sell orders, best ask at bottom
- **Spread** - Difference between best bid and ask
- **Depth Bars** - Visual representation of order size
- Shows price, size, and number of orders per level
- Scrollable for viewing many levels

### Trades Feed
- Recent executed trades stream
- Color-coded by side (green = buy, red = sell)
- Shows time, price, size, and side
- Auto-scrolls to latest trades
- Maintains history of last 100 trades

### Status Bar
- Connection status indicator
- Update count and rate (updates/sec)
- WebSocket URL display
- Reconnect button when disconnected

## Configuration Examples

### High Precision BTC Orderbook

```typescript
{
  coin: 'BTC',
  nSigFigs: 5,
  nLevels: 100,
  mantissa: 5
}
```

### Aggregated ETH Orderbook

```typescript
{
  coin: 'ETH',
  nSigFigs: 3,
  nLevels: 20,
  mantissa: undefined
}
```

### Full Precision (No Bucketing)

```typescript
{
  coin: 'SOL',
  nSigFigs: undefined,
  nLevels: 50,
  mantissa: undefined
}
```

## Price Bucketing Guide

The `nSigFigs` parameter controls how prices are grouped:

| Coin | Price Range | nSigFigs | Bucket Size | Example |
|------|-------------|----------|-------------|---------|
| BTC  | ~$100,000   | 3        | ~$1,000     | $106,000 |
| BTC  | ~$100,000   | 4        | ~$100       | $106,200 |
| BTC  | ~$100,000   | 5        | ~$10        | $106,210 |
| ETH  | ~$4,000     | 3        | ~$10        | $4,010   |
| ETH  | ~$4,000     | 4        | ~$1         | $4,001   |
| ETH  | ~$4,000     | 5        | ~$0.10      | $4,001.0 |

## Architecture

### Component Hierarchy

```
App
├── WebSocketProvider (Context)
│   └── WebSocket connection management
├── Header
│   └── Market information display
├── ConfigPanel
│   └── Live configuration controls
├── Main
│   ├── OrderBook
│   │   └── OrderBookLevel (repeated)
│   └── TradesFeed
│       └── TradeItem (repeated)
└── StatusBar
    └── Connection status & metrics
```

### Custom Hooks

- **useWebSocketContext** - Access WebSocket connection
- **useOrderBook** - Subscribe to L2 orderbook data
- **useTrades** - Subscribe to trades feed

### Data Flow

1. User configures settings via ConfigPanel
2. App component updates OrderBookConfig state
3. useOrderBook hook sends subscription to WebSocket
4. WebSocket messages arrive via WebSocketContext
5. Hook updates orderbook state
6. OrderBook component re-renders with new data

## Troubleshooting

### Cannot Connect to WebSocket

**Error:** Connection refused or timeout

**Solution:**
1. Ensure the WebSocket server is running:
   ```bash
   ps aux | grep websocket_server
   ```
2. Check the server is listening:
   ```bash
   netstat -tlnp | grep 8000
   ```
3. Verify the WebSocket URL in `.env` matches your server
4. Check browser console for detailed error messages

### No Data Displayed

**Error:** Connected but orderbook/trades are empty

**Solution:**
1. Wait 10-15 seconds for initial data
2. Check that the selected coin is supported
3. Verify the Hyperliquid node is synced (see [main README](../../README.md))
4. Check browser console for subscription errors

### Configuration Changes Not Applied

**Error:** Changing settings doesn't update the orderbook

**Solution:**
1. Click the "Apply Changes" button after modifying settings
2. Wait for the new subscription to complete
3. Check browser console for error messages

### High CPU Usage

**Solution:**
1. Reduce number of levels (try 20-30 instead of 100)
2. Close other browser tabs
3. Check if hardware acceleration is enabled in browser

### Styling Issues

**Error:** UI looks broken or misaligned

**Solution:**
1. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Ensure browser is up to date
4. Check browser console for CSS loading errors

## Performance

- **Initial Load** - ~1-2 seconds
- **Update Latency** - Sub-second (depends on node sync)
- **Memory Usage** - ~50-100MB
- **CPU Usage** - Minimal (<5% on modern hardware)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Development

### Project Structure

```
src/
├── components/        # React components
│   ├── OrderBook/    # Orderbook display
│   ├── TradesFeed/   # Trades list
│   ├── Header/       # Market header
│   ├── Controls/     # Config panel
│   └── StatusBar/    # Status display
├── hooks/            # Custom React hooks
├── context/          # React Context providers
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── constants/        # Configuration constants
├── App.tsx           # Main application
├── App.module.css    # App styling
├── main.tsx          # Entry point
└── index.css         # Global styles
```

### Adding a New Coin

1. Add the coin symbol to `AVAILABLE_COINS` in `src/constants/config.ts`:
   ```typescript
   export const AVAILABLE_COINS = [
     'BTC',
     'ETH',
     'YOUR_COIN',
     // ...
   ] as const;
   ```

2. The coin will automatically appear in the dropdown selector

### Customizing the Theme

Edit CSS Module files in each component directory:
- `OrderBook.module.css` - Orderbook styling
- `TradesFeed.module.css` - Trades styling
- `ConfigPanel.module.css` - Controls styling
- `Header.module.css` - Header styling
- `StatusBar.module.css` - Status bar styling
- `index.css` - Global theme colors

## License

MIT

## Related Documentation

- [Main Server README](../../README.md) - WebSocket server setup
- [Terminal Client](../README.md) - Command-line orderbook client
- [Hyperliquid Docs](https://hyperliquid.gitbook.io/) - Official API documentation

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review server logs for WebSocket errors
3. Check browser console for client-side errors
4. See main project README for node configuration

---

**Built with ❤️ for the Hyperliquid community**
