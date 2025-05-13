import { useVenueStore } from "~/pinia/venueStore";

export const getVenues = async () => {
  try {
    console.warn("composable");
    const store = useVenueStore();
    await store.getVenues();
  } catch (error) {
    console.error(error);
  } finally {
    // todo loader
  }
};

export const createVenues = async (venueData) => {
  try {
    console.warn("composable");
    const store = useVenueStore();
    await store.createVenues(venueData);
  } catch (error) {
    console.error(error);
  } finally {
    // todo loader
  }
};
