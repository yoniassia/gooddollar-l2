"use strict";
/**
 * GoodPerps Order Book Types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarginMode = exports.OrderStatus = exports.TimeInForce = exports.OrderType = exports.Side = void 0;
var Side;
(function (Side) {
    Side["Buy"] = "buy";
    Side["Sell"] = "sell";
})(Side || (exports.Side = Side = {}));
var OrderType;
(function (OrderType) {
    OrderType["Limit"] = "limit";
    OrderType["Market"] = "market";
    OrderType["StopLoss"] = "stop_loss";
    OrderType["TakeProfit"] = "take_profit";
})(OrderType || (exports.OrderType = OrderType = {}));
var TimeInForce;
(function (TimeInForce) {
    TimeInForce["GTC"] = "gtc";
    TimeInForce["IOC"] = "ioc";
    TimeInForce["FOK"] = "fok";
    TimeInForce["PostOnly"] = "post_only";
})(TimeInForce || (exports.TimeInForce = TimeInForce = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["New"] = "new";
    OrderStatus["PartiallyFilled"] = "partially_filled";
    OrderStatus["Filled"] = "filled";
    OrderStatus["Canceled"] = "canceled";
    OrderStatus["Rejected"] = "rejected";
    OrderStatus["Expired"] = "expired";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var MarginMode;
(function (MarginMode) {
    MarginMode["Cross"] = "cross";
    MarginMode["Isolated"] = "isolated";
})(MarginMode || (exports.MarginMode = MarginMode = {}));
//# sourceMappingURL=types.js.map