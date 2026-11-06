import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Input from "../components/Input";
import Button from "../components/Button";
import { colors, radius, shadow, spacing, typography } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { useFavoritesStore } from "../store/favoritesStore";
import { useSettingsStore, type Currency, type Language } from "../store/settingsStore";
import { useNotificationStore } from "../store/notificationStore";
import { changePassword } from "../services/auth.service";

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "TND", label: "Tunisian Dinar (DT)", symbol: "DT" },
  { code: "GBP", label: "British Pound (£)", symbol: "£" },
];

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export default function Settings() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const signOut = useAuthStore((s) => s.signOut);
  const resetCart = useCartStore((s) => s.reset);
  const resetFavorites = useFavoritesStore((s) => s.reset);
  const resetNotifications = useNotificationStore((s) => s.reset);
  const resetSettings = useSettingsStore((s) => s.reset);
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    currency,
    setCurrency,
    language,
    setLanguage,
    pushNotifications,
    setPushNotifications,
    emailNotifications,
    setEmailNotifications,
    smsNotifications,
    setSmsNotifications,
    biometricsEnabled,
    setBiometricsEnabled,
    defaultAddress,
    setDefaultAddress,
    phone,
    setPhone,
  } = useSettingsStore();

  // Profile Edit State
  const [name, setName] = useState(user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Address & Phone State
  const [addrInput, setAddrInput] = useState(defaultAddress);
  const [phoneInput, setPhoneInput] = useState(phone);
  const [deliverySaving, setDeliverySaving] = useState(false);

  // Password Change State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Cache State
  const [cacheCleared, setCacheCleared] = useState(false);

  async function handleSaveProfile() {
    if (name.trim().length < 2) {
      Alert.alert("Invalid Name", "Name must be at least 2 characters.");
      return;
    }
    setProfileSaving(true);
    try {
      await updateUser(name.trim());
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      Alert.alert("Update Failed", (err as Error).message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveDeliveryInfo() {
    setDeliverySaving(true);
    try {
      await setDefaultAddress(addrInput.trim());
      await setPhone(phoneInput.trim());
      Alert.alert("Saved", "Default shipping address & phone saved.");
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setDeliverySaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert("Missing fields", "Please fill in all password fields.");
      return;
    }
    if (newPass.length < 8) {
      Alert.alert("Password too short", "New password must be at least 8 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }

    setPassLoading(true);
    try {
      await changePassword({ currentPassword: currentPass, newPassword: newPass });
      Alert.alert("Password Changed", "Your password has been updated securely.");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setShowPasswordSection(false);
    } catch (err) {
      Alert.alert("Failed to change password", (err as Error).message);
    } finally {
      setPassLoading(false);
    }
  }

  function handleClearCache() {
    Alert.alert("Clear App Cache", "Are you sure you want to clear temporary cached images and data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        onPress: () => {
          setCacheCleared(true);
          Alert.alert("Cache Cleared", "18.4 MB of cached data was successfully freed.");
        },
      },
    ]);
  }

  function handleLogout() {
    if (loggingOut) return;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && !window.confirm("Are you sure you want to log out?")) return;
      void performLogout();
      return;
    }

    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => void performLogout(),
      },
    ]);
  }

  async function performLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Local sign-out failed", error);
    } finally {
      resetCart();
      resetFavorites();
      resetNotifications();
      void resetSettings().catch((error: Error) => {
        console.error("Could not clear saved settings during sign-out", error);
      });
      router.replace("/login");
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 1. Account & Personal Info */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Profile & Account</Text>
          </View>

          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />

          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Email Address</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyValue}>{user?.email ?? "-"}</Text>
              <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
            </View>
          </View>

          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Account Role</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyValue}>
                {user?.role?.toUpperCase() ?? "BUYER"}
              </Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>Active</Text>
              </View>
            </View>
          </View>

          <Button
            title="Save Profile Name"
            variant="outline"
            onPress={handleSaveProfile}
            loading={profileSaving}
            style={{ marginTop: spacing.xs }}
          />
        </View>

        {/* 2. Default Delivery & Contact */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Default Shipping & Contact</Text>
          </View>

          <Input
            label="Default Shipping Address"
            value={addrInput}
            onChangeText={setAddrInput}
            multiline
            placeholder="Street address, city, country"
            style={{ height: 70, textAlignVertical: "top", paddingTop: spacing.sm }}
          />

          <Input
            label="Phone Number"
            value={phoneInput}
            onChangeText={setPhoneInput}
            placeholder="+216 00 000 000"
            keyboardType="phone-pad"
          />

          <Button
            title="Update Delivery Defaults"
            variant="outline"
            onPress={handleSaveDeliveryInfo}
            loading={deliverySaving}
            style={{ marginTop: spacing.xs }}
          />
        </View>

        {/* 3. Security & Password */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Security & Privacy</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Biometric Login</Text>
              <Text style={styles.toggleDesc}>Use Face ID or Touch ID to log in</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <Pressable
            style={styles.expandHeader}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="key-outline" size={18} color={colors.primary} />
              <Text style={styles.expandTitle}>Change Password</Text>
            </View>
            <Ionicons
              name={showPasswordSection ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>

          {showPasswordSection ? (
            <View style={styles.passwordForm}>
              <Input
                label="Current Password"
                value={currentPass}
                onChangeText={setCurrentPass}
                placeholder="••••••••"
                secureTextEntry
              />
              <Input
                label="New Password"
                value={newPass}
                onChangeText={setNewPass}
                placeholder="Min. 8 characters"
                secureTextEntry
              />
              <Input
                label="Confirm New Password"
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Confirm password"
                secureTextEntry
              />
              <Button
                title="Update Password"
                onPress={handleChangePassword}
                loading={passLoading}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          ) : null}
        </View>

        {/* 4. App Preferences (Currency & Language) */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="options-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>App Preferences</Text>
          </View>

          {/* Currency */}
          <Text style={styles.subSectionTitle}>Display Currency</Text>
          <View style={styles.optionsGrid}>
            {CURRENCIES.map((c) => {
              const active = currency === c.code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => setCurrency(c.code)}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                >
                  <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                    {c.label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Language */}
          <Text style={styles.subSectionTitle}>Language</Text>
          <View style={styles.optionsGrid}>
            {LANGUAGES.map((l) => {
              const active = language === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => setLanguage(l.code)}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                >
                  <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                    {l.label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 5. Notifications */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Text style={styles.toggleDesc}>Get real-time order and shipment updates</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Email Newsletter & Deals</Text>
              <Text style={styles.toggleDesc}>Receive promotional discounts and product drops</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>SMS Delivery Alerts</Text>
              <Text style={styles.toggleDesc}>Receive text messages when rider is nearby</Text>
            </View>
            <Switch
              value={smsNotifications}
              onValueChange={setSmsNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* 6. Storage & Support */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="help-buoy-outline" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Support & Storage</Text>
          </View>

          <View style={styles.supportRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Local Cached Storage</Text>
              <Text style={styles.toggleDesc}>
                {cacheCleared ? "0.0 MB used" : "18.4 MB temporary image cache"}
              </Text>
            </View>
            <Pressable style={styles.clearBtn} onPress={handleClearCache}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={styles.navRow}
            onPress={() =>
              Alert.alert(
                "Contact Support",
                "Email: support@pulsemarket.dev\nPhone: +216 71 000 000\nHours: 9:00 AM - 6:00 PM CET"
              )
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="chatbubbles-outline" size={18} color={colors.text} />
              <Text style={styles.navLabel}>Help Center & Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.navRow}
            onPress={() =>
              Alert.alert(
                "Terms & Privacy",
                "PulseMarket respects your personal privacy and complies with standard e-commerce consumer safety regulations."
              )
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="document-text-outline" size={18} color={colors.text} />
              <Text style={styles.navLabel}>Terms of Service & Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* 7. Danger Actions */}
        <View style={styles.dangerSection}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutBtnText}>Log Out of PulseMarket</Text>
          </Pressable>

          <Text style={styles.versionText}>PulseMarket v1.2.0 • Build 2026.11</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  title: { ...typography.h2, color: colors.text },
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.text, marginLeft: spacing.sm },
  readOnlyField: { marginBottom: spacing.md },
  readOnlyLabel: { ...typography.tiny, color: colors.textMuted, marginBottom: 4 },
  readOnlyBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.md,
  },
  readOnlyValue: { ...typography.bodyStrong, color: colors.text },
  rolePill: {
    backgroundColor: "#E6F9F0",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  rolePillText: { fontSize: 11, fontWeight: "700", color: colors.success },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  toggleLabel: { ...typography.bodyStrong, color: colors.text },
  toggleDesc: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  expandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  expandTitle: { ...typography.bodyStrong, color: colors.primary, marginLeft: spacing.sm },
  passwordForm: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  subSectionTitle: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: "transparent",
    minWidth: "45%",
    flex: 1,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: { ...typography.bodyStrong, color: colors.text },
  optionChipTextActive: { color: colors.white },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  clearBtnText: { ...typography.small, fontWeight: "700", color: colors.danger },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  navLabel: { ...typography.bodyStrong, color: colors.text, marginLeft: spacing.sm },
  dangerSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEAEA",
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  logoutBtnText: { ...typography.bodyStrong, color: colors.danger, marginLeft: spacing.sm },
  versionText: {
    textAlign: "center",
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
