const settingsRepository = require("../repositories/settings.repository");

const DEFAULT_SETTINGS = {
  currency: "USD",
  language: "en",
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  defaultAddress: "",
  phone: "",
  updatedAt: null,
};

function mapSettings(row) {
  return {
    currency: row.currency,
    language: row.language,
    pushNotifications: row.push_notifications,
    emailNotifications: row.email_notifications,
    smsNotifications: row.sms_notifications,
    defaultAddress: row.default_address,
    phone: row.phone,
    updatedAt: row.updated_at,
  };
}

async function getUserSettings(userId) {
  const row = await settingsRepository.findByUserId(userId);
  return row ? mapSettings(row) : DEFAULT_SETTINGS;
}

async function updateUserSettings(userId, settings) {
  const row = await settingsRepository.upsert(userId, settings);
  return mapSettings(row);
}

module.exports = { getUserSettings, updateUserSettings };
