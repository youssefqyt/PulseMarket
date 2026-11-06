const asyncHandler = require("../utils/asyncHandler");
const notificationRepo = require("../repositories/notification.repository");

const list = asyncHandler(async (req, res) => {
  const notifications = await notificationRepo.listByUser(req.user.id);
  res.json({ success: true, data: notifications });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationRepo.markRead(req.user.id, Number(req.params.id));
  res.json({ success: true, data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationRepo.markAllRead(req.user.id);
  res.json({ success: true, data: { message: "All notifications marked as read" } });
});

module.exports = { list, markRead, markAllRead };

