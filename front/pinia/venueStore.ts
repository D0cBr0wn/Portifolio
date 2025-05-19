import { defineStore } from "pinia";
import { ref } from "vue";

export const useVenueStore = defineStore("venue", () => {
  const venues = ref<[]>([]);
  const currentVenue = ref<{}>({});
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const config = useRuntimeConfig();
  // Action pour charger les venues
  const getVenues = async () => {
    loading.value = true;
    try {
      const response = await $fetch(`${config.public.apiBase}/venues`);
      venues.value = response;
    } catch (err) {
      error.value = "Impossible de charger les lieux.";
      console.error(err);
    } finally {
      //loading.value = false;
    }
  };

  const getVenue = async (id: string) => {
    loading.value = true;
    try {
      const response = await $fetch(`${config.public.apiBase}/venues/${id}`);
      currentVenue.value = response;
    } catch (err) {
      error.value = "Impossible de charger le lieu.";
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

  const editVenue = async (venueData) => {
    loading.value = true;
    try {
      const venue = await $fetch(
        `${config.public.apiBase}/venues/${venueData.id}`,
        {
          method: "PUT",
          body: venueData,
        }
      );
      return venue;
    } catch (err) {
      error.value = "Impossible de modifier le lieu.";
      console.error(err);
    } finally {
      //loading.value = false;
    }
  };

  const deleteVenue = async (id: string) => {
    loading.value = true;
    try {
      const venue = await $fetch(`${config.public.apiBase}/venues/${id}`, {
        method: "DELETE",
      });
      return venue;
    } catch (err) {
      error.value = "Impossible de modifier le lieu.";
      console.error(err);
    } finally {
      //loading.value = false;
    }
  };

  // Retourner les valeurs et les actions
  return {
    venues,
    loading,
    error,
    getVenues,
    createVenues,
    getVenue,
    editVenue,
    deleteVenue,
  };
});
