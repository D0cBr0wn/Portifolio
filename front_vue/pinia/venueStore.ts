import { defineStore } from "pinia";
import { ref } from "vue";

export const useVenueStore = defineStore("venue", () => {
  const venues = ref<[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const config = useRuntimeConfig();
  // Action pour charger les venues
  const getVenues = async () => {
    loading.value = true;
    try {
      const response = await $fetch(`${config.public.apiBase}/venues`);
      console.warn(response);
      venues.value = response;
    } catch (err) {
      error.value = "Impossible de charger les lieux.";
      console.error(err);
    } finally {
      //loading.value = false;
    }
  };

  const createVenues = async (venueData) => {
    loading.value = true;
    try {
      const venue = await $fetch(`${config.public.apiBase}/venues`, {
        method: "POST",
        body: venueData,
      });
      return venue;
    } catch (err) {
      error.value = "Impossible de créer le lieu.";
      console.error(err);
    } finally {
      //loading.value = false;
    }
  };

  //   // Action pour ajouter un venue
  //   const addVenue = (venue: Venue) => {
  //     venues.value.push(venue)
  //   }

  //   // Action pour supprimer un venue
  //   const deleteVenue = (venueId: number) => {
  //     venues.value = venues.value.filter(venue => venue.id !== venueId)
  //   }

  // Retourner les valeurs et les actions
  return {
    venues,
    loading,
    error,
    getVenues,
    createVenues,
    // addVenue,
    // deleteVenue
  };
});
