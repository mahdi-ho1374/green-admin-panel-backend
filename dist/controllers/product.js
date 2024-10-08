"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const product_1 = __importDefault(require("../models/product"));
const error_1 = require("../models/error");
const mongodb_1 = require("mongodb");
const product_2 = require("../types/product");
const getCollectionData_1 = __importDefault(require("../helpers/getCollectionData"));
const getMinMaxOfProp_1 = __importDefault(require("../helpers/getMinMaxOfProp"));
const product_3 = __importDefault(require("../helpers/pipelines/chart/product"));
const order_1 = __importDefault(require("../models/order"));
const product_4 = require("../types/product");
const getSearchResults_1 = __importDefault(require("../helpers/getSearchResults"));
const express_validator_1 = require("express-validator");
const getProducts = async (req, res, next) => {
    try {
        const { data, lastPage } = await (0, getCollectionData_1.default)({
            collection: product_1.default,
            req,
            res,
            allowedSortProps: product_2.allowedSortProps,
            allowedFilterProps: product_2.allowedFilterProps,
        });
        if (!data && !lastPage) {
            return;
        }
        res.status(200).json({ data, lastPage });
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
};
const updateProduct = async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(422).json({ error: errors.array()[0].msg });
        return;
    }
    const body = req.body;
    const _id = body._id;
    const price = mongodb_1.Decimal128.fromString(body.price.toString());
    const quantity = body.quantity;
    const description = body.description;
    const fields = { price, quantity, description };
    try {
        const updatedProduct = await product_1.default.findByIdAndUpdate(_id, fields, {
            new: false,
        });
        updatedProduct
            ? res.status(201).json(updatedProduct)
            : res.status(404).json({ error: "The product you are trying to update doesn't exist" });
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
};
const addProduct = async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(422).json({ error: errors.array()[0].msg });
        return;
    }
    const body = req.body;
    const name = body.name;
    const price = body.price;
    const quantity = body.quantity;
    const description = body.description;
    const category = body.category;
    const salesNumber = 0;
    const newProduct = new product_1.default({
        name,
        price,
        quantity,
        description,
        salesNumber,
        category
    });
    try {
        const createdProduct = await newProduct.save();
        res.status(201).json(createdProduct);
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
};
const queryProductName = async (req, res, next) => {
    const name = req.query.name;
    if (!name.trim()) {
        res.status(400).json({ error: "Search term is empty. Please provide a valid search term." });
        return;
    }
    try {
        const filteredProducts = await product_1.default.find({
            name: new RegExp(name, 'i')
        });
        res
            .status(200)
            .json(filteredProducts);
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
};
const getProductsById = async (req, res, next) => {
    const body = req.body;
    const productIds = body.ids.map((_id) => new mongodb_1.ObjectId(_id));
    try {
        const products = await product_1.default.find({ _id: { $in: productIds } }).exec();
        res.status(200).json(products);
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
};
const getMinMax = async (req, res, next) => {
    try {
        const range = await (0, getMinMaxOfProp_1.default)({
            collection: product_1.default,
            req,
            res,
            allowedMinMaxProps: product_2.allowedMinMaxProps,
        });
        if (!range) {
            return;
        }
        res.status(200).json(range);
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
};
const getChartData = async (req, res, next) => {
    try {
        const data = await order_1.default.aggregate(product_3.default.category("monthly"));
        res.status(200).json(data);
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
};
const queryProduct = async (req, res, next) => {
    const term = String(req.query.term);
    const autoComplete = Boolean(req.query.autoComplete);
    if (!term.trim()) {
        res.status(400).json({ error: "Search term is empty. Please provide a valid search term." });
        return;
    }
    try {
        const fields = Object.values(product_4.AllowedSearchFields);
        const data = await (0, getSearchResults_1.default)({ model: product_1.default, fields, autoComplete, term });
        res.status(200).json(data);
    }
    catch (err) {
        const error = new error_1.Erroro(err, 500);
        return next(error);
    }
};
exports.default = {
    updateProduct,
    addProduct,
    queryProduct,
    queryProductName,
    getProducts,
    getProductsById,
    getMinMax,
    getChartData,
};