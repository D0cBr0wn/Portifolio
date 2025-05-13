<template>
  <v-app>
    <v-main>
      <v-container class="pa-6">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">Venues</span>
            <v-btn color="primary" @click="dialog = true">Add a venue</v-btn>
          </v-card-title>
          <pre>{{ store.venues }} venues</pre>
          <v-data-table
            :headers="headers"
            :items="store.venues"
            class="elevation-1"
          />
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
                  v-model="currentVenue.address"
                  label="Address"
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
              <v-btn text @click="dialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="addVenue">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from "vue";
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
  city: "",
});

const headers = [
  { text: "Name", value: "name" },
  { text: "Address", value: "address" },
  { text: "Zip Code", value: "zipCode" },
  { text: "City", value: "city" },
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
  if (
    currentVenue.value.name &&
    currentVenue.value.address &&
    currentVenue.value.zipCode &&
    currentVenue.value.city
  ) {
    await createVenues(currentVenue.value);
    currentVenue.value = { name: "", address: "", zipCode: "", city: "" };
    dialog.value = false;
  }
};
</script>

<style scoped lang="scss"></style>

<style lang="scss"></style>
