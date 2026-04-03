// ============================================================
// GoodPredict CLOB Matching Engine
// ============================================================
// In-memory order book with price-time priority matching.
// Each market has two books (YES and NO).
// Supports complementary matching: BUY YES @ 0.60 matches BUY NO @ 0.40.
import { v4 as uuid } from 'uuid';
/**
 * A single-sided order book (bids or asks for one token).
 * Bids sorted by price descending (highest first).
 * Asks sorted by price ascending (lowest first).
 */
class PriceLevelQueue {
    levels = new Map();
    sortedPrices = [];
    ascending;
    constructor(ascending) {
        this.ascending = ascending;
    }
    add(order) {
        const price = order.price;
        if (!this.levels.has(price)) {
            this.levels.set(price, []);
            this.sortedPrices.push(price);
            this.sortedPrices.sort((a, b) => this.ascending ? a - b : b - a);
        }
        this.levels.get(price).push(order);
    }
    remove(orderId) {
        for (const [price, orders] of this.levels) {
            const idx = orders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
                const [removed] = orders.splice(idx, 1);
                if (orders.length === 0) {
                    this.levels.delete(price);
                    this.sortedPrices = this.sortedPrices.filter(p => p !== price);
                }
                return removed;
            }
        }
        return undefined;
    }
    bestPrice() {
        return this.sortedPrices[0];
    }
    bestOrders() {
        const best = this.bestPrice();
        if (best === undefined)
            return [];
        return this.levels.get(best) || [];
    }
    peekBest() {
        const orders = this.bestOrders();
        return orders[0];
    }
    isEmpty() {
        return this.sortedPrices.length === 0;
    }
    getLevels() {
        return this.sortedPrices.map(price => {
            const orders = this.levels.get(price) || [];
            const size = orders.reduce((sum, o) => sum + (o.size - o.filledSize), 0);
            return { price, size, orders: orders.length };
        });
    }
    /** Get all orders (for iteration) */
    allOrders() {
        const result = [];
        for (const price of this.sortedPrices) {
            result.push(...(this.levels.get(price) || []));
        }
        return result;
    }
}
/**
 * Order book for a single market token (YES or NO).
 */
class TokenOrderBook {
    marketId;
    token;
    bids; // Buy orders (highest first)
    asks; // Sell orders (lowest first)
    constructor(marketId, token) {
        this.marketId = marketId;
        this.token = token;
        this.bids = new PriceLevelQueue(false); // descending
        this.asks = new PriceLevelQueue(true); // ascending
    }
    getSnapshot() {
        const bids = this.bids.getLevels();
        const asks = this.asks.getLevels();
        const bestBid = this.bids.bestPrice() ?? 0;
        const bestAsk = this.asks.bestPrice() ?? 1;
        const midpoint = (bestBid + bestAsk) / 2;
        const spread = bestAsk - bestBid;
        return {
            marketId: this.marketId,
            token: this.token,
            bids,
            asks,
            midpoint,
            spread,
            timestamp: Date.now(),
        };
    }
}
export class OrderBookEngine {
    books = new Map();
    orders = new Map();
    onTrade;
    onOrderUpdate;
    constructor(opts) {
        this.onTrade = opts?.onTrade;
        this.onOrderUpdate = opts?.onOrderUpdate;
    }
    /** Initialize order books for a market */
    initMarket(marketId) {
        if (this.books.has(marketId))
            return;
        this.books.set(marketId, {
            yes: new TokenOrderBook(marketId, 'YES'),
            no: new TokenOrderBook(marketId, 'NO'),
        });
    }
    /** Place a new order into the book */
    placeOrder(params) {
        const { marketId, token, side, price, size, maker, type = 'GTC', expiration } = params;
        // Validate
        if (price <= 0 || price >= 1)
            throw new Error('Price must be between 0 and 1 exclusive');
        if (size <= 0)
            throw new Error('Size must be positive');
        this.initMarket(marketId);
        const order = {
            id: uuid(),
            marketId,
            token,
            side,
            price: Math.round(price * 100) / 100, // Round to 2 decimal places (tick size 0.01)
            size,
            filledSize: 0,
            status: 'OPEN',
            type,
            maker,
            expiration,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        // Try to match
        const trades = this.matchOrder(order);
        // Handle order types
        const remaining = order.size - order.filledSize;
        if (remaining > 0) {
            if (type === 'FOK') {
                // Fill or Kill: if not fully filled, cancel everything
                if (order.filledSize > 0) {
                    // Undo trades (in production, would revert)
                    order.status = 'CANCELLED';
                    this.onOrderUpdate?.(order);
                    return { trades: [], remainingOrder: null };
                }
                order.status = 'CANCELLED';
                this.onOrderUpdate?.(order);
                return { trades: [], remainingOrder: null };
            }
            if (type === 'FAK') {
                // Fill and Kill: keep what's filled, cancel the rest
                order.status = order.filledSize > 0 ? 'PARTIALLY_FILLED' : 'CANCELLED';
                this.onOrderUpdate?.(order);
                return { trades, remainingOrder: null };
            }
            // GTC: rest on book
            this.addToBook(order);
            this.orders.set(order.id, order);
            this.onOrderUpdate?.(order);
        }
        else {
            order.status = 'FILLED';
            this.onOrderUpdate?.(order);
        }
        return {
            trades,
            remainingOrder: remaining > 0 ? order : null,
        };
    }
    /** Cancel an order by ID */
    cancelOrder(orderId) {
        const order = this.orders.get(orderId);
        if (!order || order.status === 'FILLED' || order.status === 'CANCELLED') {
            return undefined;
        }
        const books = this.books.get(order.marketId);
        if (!books)
            return undefined;
        const book = order.token === 'YES' ? books.yes : books.no;
        const queue = order.side === 'BUY' ? book.bids : book.asks;
        queue.remove(orderId);
        order.status = 'CANCELLED';
        order.updatedAt = Date.now();
        this.orders.delete(orderId);
        this.onOrderUpdate?.(order);
        return order;
    }
    /** Get order book snapshot for a market token */
    getOrderBook(marketId, token) {
        const books = this.books.get(marketId);
        if (!books)
            return undefined;
        const book = token === 'YES' ? books.yes : books.no;
        return book.getSnapshot();
    }
    /** Get midpoint price */
    getMidpoint(marketId, token) {
        const snap = this.getOrderBook(marketId, token);
        if (!snap)
            return undefined;
        if (snap.bids.length === 0 && snap.asks.length === 0)
            return undefined;
        return snap.midpoint;
    }
    /** Get an order by ID */
    getOrder(orderId) {
        return this.orders.get(orderId);
    }
    /** Get all open orders for a maker */
    getOrdersByMaker(maker) {
        return Array.from(this.orders.values()).filter(o => o.maker === maker);
    }
    // ============================================================
    // Private matching logic
    // ============================================================
    matchOrder(incomingOrder) {
        const trades = [];
        const books = this.books.get(incomingOrder.marketId);
        const book = incomingOrder.token === 'YES' ? books.yes : books.no;
        // Direct matching: BUY matches against ASK, SELL matches against BID
        const oppositeQueue = incomingOrder.side === 'BUY' ? book.asks : book.bids;
        while (incomingOrder.filledSize < incomingOrder.size && !oppositeQueue.isEmpty()) {
            const bestResting = oppositeQueue.peekBest();
            // Check if prices cross
            const pricesCross = incomingOrder.side === 'BUY'
                ? incomingOrder.price >= bestResting.price
                : incomingOrder.price <= bestResting.price;
            if (!pricesCross)
                break;
            // Execute at resting order's price (price improvement for taker)
            const fillPrice = bestResting.price;
            const fillSize = Math.min(incomingOrder.size - incomingOrder.filledSize, bestResting.size - bestResting.filledSize);
            // Create trade
            const trade = {
                id: uuid(),
                marketId: incomingOrder.marketId,
                token: incomingOrder.token,
                makerOrderId: bestResting.id,
                takerOrderId: incomingOrder.id,
                price: fillPrice,
                size: fillSize,
                maker: bestResting.maker,
                taker: incomingOrder.maker,
                status: 'MATCHED',
                createdAt: Date.now(),
            };
            trades.push(trade);
            this.onTrade?.(trade);
            // Update fill sizes
            incomingOrder.filledSize += fillSize;
            bestResting.filledSize += fillSize;
            incomingOrder.updatedAt = Date.now();
            bestResting.updatedAt = Date.now();
            // If resting order fully filled, remove from book
            if (bestResting.filledSize >= bestResting.size) {
                oppositeQueue.remove(bestResting.id);
                bestResting.status = 'FILLED';
                this.orders.delete(bestResting.id);
                this.onOrderUpdate?.(bestResting);
            }
            else {
                bestResting.status = 'PARTIALLY_FILLED';
                this.onOrderUpdate?.(bestResting);
            }
        }
        // Complementary matching: BUY YES @ 0.60 can match with BUY NO @ 0.40+
        // (Because YES + NO = $1, so someone buying NO at 0.40 is effectively selling YES at 0.60)
        if (incomingOrder.filledSize < incomingOrder.size && incomingOrder.side === 'BUY') {
            const complementaryBook = incomingOrder.token === 'YES' ? books.no : books.yes;
            const complementaryBids = complementaryBook.bids;
            while (incomingOrder.filledSize < incomingOrder.size && !complementaryBids.isEmpty()) {
                const bestComplement = complementaryBids.peekBest();
                // Check if complementary prices sum to >= $1
                // BUY YES @ 0.60 + BUY NO @ 0.40 = $1.00 → match
                if (incomingOrder.price + bestComplement.price < 1.0)
                    break;
                // Fill price: incoming gets their price, complement gets their price
                // The "surplus" (if sum > $1) goes as price improvement
                const fillSize = Math.min(incomingOrder.size - incomingOrder.filledSize, bestComplement.size - bestComplement.filledSize);
                const trade = {
                    id: uuid(),
                    marketId: incomingOrder.marketId,
                    token: incomingOrder.token,
                    makerOrderId: bestComplement.id,
                    takerOrderId: incomingOrder.id,
                    price: incomingOrder.price, // Each side pays their price
                    size: fillSize,
                    maker: bestComplement.maker,
                    taker: incomingOrder.maker,
                    status: 'MATCHED',
                    createdAt: Date.now(),
                };
                trades.push(trade);
                this.onTrade?.(trade);
                incomingOrder.filledSize += fillSize;
                bestComplement.filledSize += fillSize;
                incomingOrder.updatedAt = Date.now();
                bestComplement.updatedAt = Date.now();
                if (bestComplement.filledSize >= bestComplement.size) {
                    complementaryBids.remove(bestComplement.id);
                    bestComplement.status = 'FILLED';
                    this.orders.delete(bestComplement.id);
                    this.onOrderUpdate?.(bestComplement);
                }
                else {
                    bestComplement.status = 'PARTIALLY_FILLED';
                    this.onOrderUpdate?.(bestComplement);
                }
            }
        }
        // Update incoming order status
        if (incomingOrder.filledSize > 0 && incomingOrder.filledSize < incomingOrder.size) {
            incomingOrder.status = 'PARTIALLY_FILLED';
        }
        else if (incomingOrder.filledSize >= incomingOrder.size) {
            incomingOrder.status = 'FILLED';
        }
        return trades;
    }
    addToBook(order) {
        const books = this.books.get(order.marketId);
        const book = order.token === 'YES' ? books.yes : books.no;
        const queue = order.side === 'BUY' ? book.bids : book.asks;
        queue.add(order);
    }
}
//# sourceMappingURL=orderbook.js.map