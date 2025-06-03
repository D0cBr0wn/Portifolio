import { useVenueStore } from "~/pinia/venueStore";

export const getVenues = async () => {
  try {
    const store = useVenueStore();
    await store.getVenues();
  } catch (error) {
    console.error(error);
  } finally {
    // todo loader
  }
};

export const getVenue = async (id: string) => {
  try {
    const store = useVenueStore();
    await store.getVenue(id);
  } catch (error) {
    console.error(error);
  } finally {
    // todo loader
  }
};

export const createVenues = async (venueData) => {
  try {
    const store = useVenueStore();
    await store.createVenues(venueData);
  } catch (error) {
    console.error(error);
  } finally {
    // todo loader
  }
};

export const editVenue = async (venueData) => {
  try {
    const store = useVenueStore();
    await store.editVenue(venueData);
  } catch (error) {
    console.error(error);
  } finally {
    // todo loader
  }
};

export const deleteVenue = async (id: string) => {
  try {
    const store = useVenueStore();
    await store.editVenue(id);
  } catch (error) {
    console.error(error);
  } finally {
    // todo loader
  }
};
