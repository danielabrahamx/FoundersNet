import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get all events from the API server
 * @returns Object with events array and query state
 */
export function useAllEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });
}

/**
 * Hook to get a specific event by ID
 * @param eventId - The ID of the event
 * @returns Object with event details and query state
 */
export function useEvent(eventId: number | undefined) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      return response.json();
    },
    enabled: eventId !== undefined,
  });
}
