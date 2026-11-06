const { query } = require("../config/db");

const COLUMNS = `
  user_id, currency, language, push_notifications, email_notifications,
  sms_notifications, default_address, phone, updated_at
`;

async function findByUserId(userId) {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM user_settings WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

async function upsert(userId, settings) {
  const {
    currency,
    language,
    pushNotifications,
    emailNotifications,
    smsNotifications,
    defaultAddress,
    phone,
  } = settings;

  const { rows } = await query(
    `INSERT INTO user_settings (
       user_id, currency, language, push_notifications, email_notifications,
       sms_notifications, default_address, phone
     )
     VALUES (
       $1, COALESCE($2, 'USD'), COALESCE($3, 'en'),
       COALESCE($4, TRUE), COALESCE($5, TRUE), COALESCE($6, FALSE),
       COALESCE($7, ''), COALESCE($8, '')
     )
     ON CONFLICT (user_id) DO UPDATE SET
       currency = COALESCE($2, user_settings.currency),
       language = COALESCE($3, user_settings.language),
       push_notifications = COALESCE($4, user_settings.push_notifications),
       email_notifications = COALESCE($5, user_settings.email_notifications),
       sms_notifications = COALESCE($6, user_settings.sms_notifications),
       default_address = COALESCE($7, user_settings.default_address),
       phone = COALESCE($8, user_settings.phone),
       updated_at = now()
     RETURNING ${COLUMNS}`,
    [
      userId,
      currency ?? null,
      language ?? null,
      pushNotifications ?? null,
      emailNotifications ?? null,
      smsNotifications ?? null,
      defaultAddress ?? null,
      phone ?? null,
    ]
  );
  return rows[0];
}

module.exports = { findByUserId, upsert };
