const ApiError = require("../utils/ApiError");
const { hashPassword, verifyPassword } = require("../utils/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/jwt");
const { mapUser } = require("../models");
const userRepo = require("../repositories/user.repository");
const tokenRepo = require("../repositories/refreshToken.repository");

/** Build the access + refresh token pair and persist the refresh hash. */
async function issueTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    sellerStatus: user.seller_status || "approved",
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const decoded = verifyRefreshToken(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);
  await tokenRepo.store(user.id, hashToken(refreshToken), expiresAt);

  return { accessToken, refreshToken };
}

async function register({ name, email, password, role }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ name, email, passwordHash, role: role || "user" });
  const tokens = await issueTokens(user);

  return { user: mapUser(user), ...tokens };
}

async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  // Same generic message whether the email or the password is wrong.
  if (!user) throw ApiError.unauthorized("Invalid email or password");
  if (user.is_suspended) throw ApiError.forbidden("This account is suspended");

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

  const tokens = await issueTokens(user);
  return { user: mapUser(user), ...tokens };
}

/** Refresh-token ROTATION: the old token is revoked and a new pair is issued. */
async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const stored = await tokenRepo.findValid(hashToken(refreshToken));
  if (!stored) throw ApiError.unauthorized("Refresh token has been revoked");

  const user = await userRepo.findById(decoded.sub);
  if (!user) throw ApiError.unauthorized("User no longer exists");
  if (user.is_suspended) throw ApiError.forbidden("This account is suspended");

  await tokenRepo.revoke(hashToken(refreshToken)); // rotate
  const tokens = await issueTokens(user);
  return { user: mapUser(user), ...tokens };
}

async function logout(refreshToken) {
  if (refreshToken) await tokenRepo.revoke(hashToken(refreshToken));
}

async function me(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return mapUser(user);
}

async function updateProfile(userId, { name, avatarUrl }) {
  const user = await userRepo.updateProfile(userId, { name, avatarUrl });
  if (!user) throw ApiError.notFound("User not found");
  return mapUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await userRepo.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const fullUser = await userRepo.findByEmail(user.email);
  const ok = await verifyPassword(currentPassword, fullUser.password_hash);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");

  const newHash = await hashPassword(newPassword);
  await userRepo.updatePassword(userId, newHash);
  return { message: "Password updated successfully" };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
};
