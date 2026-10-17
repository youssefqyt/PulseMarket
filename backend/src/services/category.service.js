const { mapCategory } = require("../models");
const categoryRepo = require("../repositories/category.repository");

async function list() {
  const rows = await categoryRepo.findAll();
  return rows.map(mapCategory);
}

async function listWithCounts() {
  const rows = await categoryRepo.findAllWithCounts();
  return rows.map((r) => ({ ...mapCategory(r), productCount: r.product_count }));
}

module.exports = { list, listWithCounts };
