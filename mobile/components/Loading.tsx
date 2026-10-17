import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../constants/theme";

export default function Loading({ fullscreen = true }: { fullscreen?: boolean }) {
  return (
    <View style={fullscreen ? styles.fullscreen : styles.inline}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  inline: { paddingVertical: 32, alignItems: "center" },
});
