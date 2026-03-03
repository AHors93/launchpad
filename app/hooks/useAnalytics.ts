import { usePostHog } from 'posthog-react-native';
import { useCallback } from 'react';

type AnalyticsEvent =
  | { name: 'idea_created'; properties: { ideaId: string; trackType?: string } }
  | { name: 'idea_deleted'; properties: { ideaId: string } }
  | { name: 'idea_status_changed'; properties: { ideaId: string; status: string } }
  | { name: 'idea_title_edited'; properties: { ideaId: string } }
  | { name: 'idea_saved_from_chat'; properties?: undefined }
  | { name: 'conversation_started'; properties?: undefined }
  | { name: 'conversation_deleted'; properties?: undefined }
  | { name: 'message_sent'; properties?: undefined }
  | { name: 'profile_setup_completed'; properties?: undefined }
  | { name: 'profile_field_updated'; properties: { field: string } }
  | { name: 'explore_searched'; properties: { query: string } }
  | { name: 'explore_path_saved'; properties: { title: string } }
  | { name: 'explore_path_deleted'; properties?: undefined }
  | { name: 'blog_post_created'; properties?: undefined }
  | { name: 'blog_comment_added'; properties?: undefined }
  | { name: 'onboarding_completed'; properties?: undefined }
  | { name: 'feedback_sent'; properties?: undefined }
  | { name: 'tab_viewed'; properties: { tab: string } }
  | { name: 'action_tapped'; properties: { type: string } };

export function useAnalytics() {
  const posthog = usePostHog();

  const track = useCallback(
    (event: AnalyticsEvent) => {
      posthog?.capture(event.name, event.properties);
    },
    [posthog],
  );

  const identify = useCallback(
    (userId: string, properties?: Record<string, string>) => {
      posthog?.identify(userId, properties);
    },
    [posthog],
  );

  const reset = useCallback(() => {
    posthog?.reset();
  }, [posthog]);

  return { track, identify, reset };
}
