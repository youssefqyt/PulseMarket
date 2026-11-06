const asyncHandler = require("../utils/asyncHandler");
const settingsService = require("../services/settings.service");

const get = asyncHandler(async (req, res) => {
  const settings = await settingsService.getUserSettings(req.user.id);
  res.json({ success: true, data: settings });
});

const update = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateUserSettings(req.user.id, req.body);
  res.json({ success: true, data: settings });
});

module.exports = { get, update };
