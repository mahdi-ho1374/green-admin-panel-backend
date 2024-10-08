import { Status } from "../../../types/order";

const category = (groupBy: "monthly" | "daily") => 
  [
    {
      $match: {
        status: { $ne: Status.CANCELED },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "products",
        localField: "items._id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $project: {
        _id: 0,
        category: "$product.category",
        year: groupBy === "monthly" ? { $year: "$createdAt" } : undefined,
        month: groupBy === "monthly" ? { $month: "$createdAt" } : undefined,
        totalRevenue: { $multiply: ["$items.amount", "$items.price"] },
        totalAmount: { $sum: "$items.amount" },
      },
    },
    {
      $group: {
        _id: {
          year: "$year",
          month: "$month",
          category: "$category",
        },
        totalRevenue: { $sum: "$totalRevenue" },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
    {
      $group: {
        _id: {
          year: "$_id.year",
          month: "$_id.month",
        },
        year: {$first: "$_id.year"},
        month: {$first: "$_id.month"},
        revenue: {
          $push: {
            category: "$_id.category",
            revenue: "$totalRevenue",
          },
        },
        amount: {
          $push: {
          category: "$_id.category",
          amount: "$totalAmount"
        }
        }
      },
    }
  ] as any[];

export default { category };