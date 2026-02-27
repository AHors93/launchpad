import * as Haptics from 'expo-haptics';

/** Light tap — button presses, selections */
export function hapticLight() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — confirmations, successful saves */
export function hapticMedium() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Success — idea created, message sent */
export function hapticSuccess() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning — destructive action confirmation */
export function hapticWarning() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
