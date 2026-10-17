const asyncHandler = require("../utils/asyncHandler");
const categoryService = require("../services/category.service");

const list = asyncHandler(async (req, res) => {
  // ?withCounts=true returns product counts per category.
  const withCounts = req.query.withCounts === "true";
  const categories = withCounts
    ? await categoryService.listWithCounts()
    : await categoryService.list();
  res.json({ success: true, data: categories });
});

module.exports = { list };
