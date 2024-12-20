"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
const order_1 = __importDefault(require("../models/order"));
const comment_1 = __importDefault(require("../models/comment"));
const product_1 = __importDefault(require("../models/product"));
const error_1 = require("../models/error");
const order_2 = require("../types/order");
const firstBuy_1 = __importDefault(require("../helpers/pipelines/user/firstBuy"));
const user_2 = __importDefault(require("../helpers/pipelines/chart/user"));
const comment_2 = __importDefault(require("../helpers/pipelines/chart/comment"));
const sale_1 = __importDefault(require("../helpers/pipelines/chart/sale"));
const order_3 = __importDefault(require("../helpers/pipelines/chart/order"));
const product_2 = __importDefault(require("../helpers/pipelines/chart/product"));
const getDateRangeMatchPipeline_1 = __importDefault(require("../helpers/pipelines/getDateRangeMatchPipeline"));
const combineChartData_1 = __importDefault(require("../helpers/pipelines/chart/combineChartData"));
const getTotals = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalUsers = yield user_1.default.countDocuments();
        const totalOrders = yield order_1.default.countDocuments();
        const totalCustomers = yield user_1.default.countDocuments({ orders: { $ne: [] } });
        const totalProducts = yield product_1.default.countDocuments();
        const totalComments = yield comment_1.default.countDocuments();
        const userToCustomerRate = `${((totalCustomers / totalUsers) * 100).toFixed(2)}%`;
        const getMatchPipeline = () => [{ $match: { status: { $ne: order_2.Status.CANCELED } } }];
        const getGroupPipeline = (propName, field) => [
            { $group: { _id: null, [propName]: { $sum: `$${field}` } } },
        ];
        const aggregatedTotalRevenue = yield order_1.default.aggregate([
            ...getMatchPipeline(),
            ...getGroupPipeline("totalRevenue", "totalPrice"),
        ]);
        const aggregatedTotalAmounts = yield order_1.default.aggregate([
            ...getMatchPipeline(),
            { $unwind: "$items" },
            ...getGroupPipeline("totalAmounts", "items.amount"),
        ]);
        const totalAmounts = aggregatedTotalAmounts[0].totalAmounts;
        const totalRevenue = aggregatedTotalRevenue[0].totalRevenue;
        res.status(200).json({
            totalRevenue,
            totalProducts,
            totalOrders,
            totalUsers,
            totalAmounts,
            totalComments,
            totalCustomers,
            userToCustomerRate,
        });
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
});
const getLast30DaysData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    const sixtyDaysAgo = new Date();
    const thirtyOneDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyOneDaysAgo.setDate(now.getDate() - 30);
    sixtyDaysAgo.setDate(now.getDate() - 59);
    const getMatchPipeline = (previous) => (0, getDateRangeMatchPipeline_1.default)(previous ? sixtyDaysAgo : thirtyDaysAgo, previous ? thirtyOneDaysAgo : new Date());
    const getCountPipeline = () => [{ $count: "count" }];
    const getSumPipeline = (field) => [
        { $group: { _id: null, total: { $sum: `$${field}` } } },
        {
            $project: {
                _id: 0,
                total: 1,
            },
        },
    ];
    const getMatchCustomerPipeline = () => [...firstBuy_1.default];
    try {
        const current30DaysUsers = yield user_1.default.aggregate([
            ...getMatchPipeline(),
            ...getCountPipeline(),
        ]);
        const previous30DaysUsers = yield user_1.default.aggregate([
            ...getMatchPipeline(true),
            ...getCountPipeline(),
        ]);
        const current30DaysOrders = yield order_1.default.aggregate([
            ...getMatchPipeline(),
            ...getCountPipeline(),
        ]);
        const previous30DaysOrders = yield order_1.default.aggregate([
            ...getMatchPipeline(true),
            ...getCountPipeline(),
        ]);
        const current30DaysComments = yield comment_1.default.aggregate([
            ...getMatchPipeline(),
            ...getCountPipeline(),
        ]);
        const previous30DaysComments = yield comment_1.default.aggregate([
            ...getMatchPipeline(true),
            ...getCountPipeline(),
        ]);
        const current30DaysRevenue = yield order_1.default.aggregate([
            ...getMatchPipeline(),
            { $match: { status: { $ne: order_2.Status.CANCELED } } },
            ...getSumPipeline("totalPrice"),
        ]);
        const previous30DaysRevenue = yield order_1.default.aggregate([
            ...getMatchPipeline(true),
            { $match: { status: { $ne: order_2.Status.CANCELED } } },
            ...getSumPipeline("totalPrice"),
        ]);
        const current30DaysAmount = yield order_1.default.aggregate([
            ...getMatchPipeline(),
            { $match: { status: { $ne: order_2.Status.CANCELED } } },
            { $unwind: "$items" },
            ...getSumPipeline("items.amount"),
        ]);
        const previous30DaysAmount = yield order_1.default.aggregate([
            ...getMatchPipeline(true),
            { $match: { status: { $ne: order_2.Status.CANCELED } } },
            { $unwind: "$items" },
            ...getSumPipeline("items.amount"),
        ]);
        const current30DaysCustomers = yield order_1.default.aggregate([
            ...getMatchPipeline(),
            ...getMatchCustomerPipeline(),
            ...getCountPipeline(),
        ]);
        const previous30DaysCustomers = yield order_1.default.aggregate([
            ...getMatchPipeline(true),
            ...getMatchCustomerPipeline(),
            ...getCountPipeline(),
        ]);
        res.status(200).json({
            last30DaysUsers: [
                previous30DaysUsers[0]["count"],
                current30DaysUsers[0]["count"],
            ],
            last30DaysCustomers: [
                previous30DaysCustomers[0]["count"],
                current30DaysCustomers[0]["count"],
            ],
            last30DaysOrders: [
                previous30DaysOrders[0]["count"],
                current30DaysOrders[0]["count"],
            ],
            last30DaysComments: [
                previous30DaysComments[0]["count"],
                current30DaysComments[0]["count"],
            ],
            last30DaysRevenue: [
                previous30DaysRevenue[0]["total"],
                current30DaysRevenue[0]["total"],
            ],
            last30DaysAmounts: [
                previous30DaysAmount[0]["total"],
                current30DaysAmount[0]["total"],
            ],
        });
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
});
const getChartData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 29);
    try {
        const dateMatchPipeline = () => (0, getDateRangeMatchPipeline_1.default)(thirtyDaysAgo, now);
        const users = yield (0, combineChartData_1.default)(user_1.default.aggregate([
            ...dateMatchPipeline(),
            ...user_2.default.signUp("daily"),
        ]), order_1.default.aggregate([
            ...dateMatchPipeline(),
            ...user_2.default.firstBuy("daily"),
        ]));
        const comments = yield comment_1.default.aggregate([
            ...dateMatchPipeline(),
            ...comment_2.default.createdAt("daily"),
        ]);
        const orders = yield order_1.default.aggregate([
            ...dateMatchPipeline(),
            ...order_3.default.createdAt("daily"),
        ]);
        const sales = yield (0, combineChartData_1.default)(order_1.default.aggregate([
            ...dateMatchPipeline(),
            ...sale_1.default.revenue("daily"),
        ]), order_1.default.aggregate([
            ...dateMatchPipeline(),
            ...sale_1.default.amount("daily"),
        ]));
        const categories = yield order_1.default.aggregate([
            ...dateMatchPipeline(),
            ...product_2.default.category("daily"),
        ]);
        const chartsData = { users, comments, orders, sales, categories };
        let dates = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(thirtyDaysAgo);
            date.setDate(thirtyDaysAgo.getDate() + i);
            dates.push({
                day: date.getDate(),
                year: date.getFullYear(),
                month: date.getMonth() + 1,
            });
        }
        const filledGapChartsData = Object.entries(chartsData).reduce((result, [entry, data]) => {
            if (entry === "categories") {
                delete data[0].month;
                delete data[0].year;
                result[entry] = data;
                return result;
            }
            const props = data.reduce((props, item) => {
                const { _id, day } = item, restProps = __rest(item, ["_id", "day"]);
                return [...new Set([...props, ...Object.keys(restProps)])];
            }, []);
            result[entry] = dates.map((date) => {
                const existingChartItem = data.find((item) => item._id.month === date.month &&
                    item._id.day === date.day &&
                    item._id.year === date.year);
                if (!existingChartItem) {
                    const chartItem = { _id: date, day: date.day };
                    props.forEach((prop) => {
                        chartItem[prop] = 0;
                    });
                    return chartItem;
                }
                else {
                    props.forEach((prop) => {
                        if (!(prop in existingChartItem)) {
                            existingChartItem[prop] = 0;
                        }
                    });
                    return existingChartItem;
                }
            });
            return result;
        }, {});
        res.status(200).json(filledGapChartsData);
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
});
exports.default = { getTotals, getLast30DaysData, getChartData };
