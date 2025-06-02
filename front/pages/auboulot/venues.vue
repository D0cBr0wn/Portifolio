<template>
  <v-app>
    <v-main>
      <v-container class="pa-6">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">Venues</span>
            <v-btn color="primary" @click="dialog = true">Add a venue</v-btn>
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="store.venues"
            class="elevation-1"
          >
            <template v-slot:item.actions="{ item }">
              <div class="d-flex ga-2 justify-end">
                <v-icon
                  color="medium-emphasis"
                  icon="mdi-pencil"
                  size="small"
                  @click="launchEditVenue(item.id)"
                ></v-icon>

                <v-icon
                  color="medium-emphasis"
                  icon="mdi-delete"
                  size="small"
                  @click="deleteVenue(item.id)"
                ></v-icon>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <!-- Dialog for creating a new venue -->
        <v-dialog v-model="dialog" max-width="500px">
          <v-card>
            <v-card-title>Add a new venue</v-card-title>
            <v-card-text>
              <v-form @submit.prevent="addVenue">
                <v-text-field
                  v-model="currentVenue.name"
                  label="Name"
                  required
                />
                <v-text-field
                  v-model="currentVenue.address1"
                  label="Address 1"
                  required
                />
                <v-text-field
                  v-model="currentVenue.address2"
                  label="Address 2"
                  required
                />
                <v-text-field
                  v-model="currentVenue.zipCode"
                  label="Zip Code"
                  required
                />
                <v-text-field
                  v-model="currentVenue.city"
                  label="City"
                  required
                />
              </v-form>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn text @click="cancel()">Cancel</v-btn>
              <v-btn color="primary" @click="saveVenue()">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { editVenue } from "~/composables/venuesComposables";
import { useVenueStore } from "~/pinia/venueStore";

definePageMeta({
  layout: "admin",
});

const store = useVenueStore();

//datas
const dialog = ref(false);
const currentVenue = ref({
  id: "",
  name: "",
  address1: "",
  address2: "",
  zipCode: "",
  city: "",
});

const headers = [
  { title: "Name", key: "name" },
  { title: "Address 1", key: "address1" },
  { title: "Address 2", key: "address2" },
  { title: "Zip Code", key: "zipCode" },
  { title: "City", key: "city" },
  { title: "Action", key: "actions", sortable: false },
];

// const venues = ref([
//   // Tu peux commencer avec des données mock
//   { name: "Le Zénith", address: "12 rue Pop", zipCode: "75019", city: "Paris" },
//   {
//     name: "La Cigale",
//     address: "120 bd Rochechouart",
//     zipCode: "75018",
//     city: "Paris",
//   },
// ]);
onMounted(async () => {
  await getVenues();
});

const addVenue = async () => {
  if (currentVenue.value.name && currentVenue.value.city) {
    await createVenues(currentVenue.value);

    dialog.value = false;
  }
};

const setCurrentVenue = (id: string) => {
  currentVenue.value = store.venues.find((v) => v.id === id);
};

const launchEditVenue = (id: string) => {
  setCurrentVenue(id);
  dialog.value = true;
};

const deleteVenue = async (id: string) => {
  await store.deleteVenue(id);
  await getVenues();
};

const saveVenue = async () => {
  if (currentVenue.value.id !== "") {
    await editVenue(currentVenue.value);
  } else {
    await addVenue();
  }
  await getVenues();
  cancel();
};

const cancel = () => {
  dialog.value = false;
  currentVenue.value = {
    id: "",
    name: "",
    address1: "",
    address2: "",
    zipCode: "",
    city: "",
  };
};
</script>

<style scoped lang="scss"></style>

<style lang="scss"></style>
