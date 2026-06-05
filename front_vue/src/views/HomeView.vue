<template>
  <PublicLayout>
    <section class="hero-text">
      <h1 class="artist-name" data-testid="home-heading">Portfolio</h1>
      <p class="tagline">
        Odyssey Of One, is a raw, minimalist folk music project, built around
        Nico’s guitar and voice, formerly the bass player of the post-hardcore
        band TANEN. Listening to Bob Dylan and The Tallest Man On Earth
        introduced him to this introspective, authentic language. On stage, he
        offers a stripped-down, sincere experience: one voice, one guitar, and
        the desire to convey pure, unadorned emotion. The project also stands
        out for its willingness to share the creative process in real time,
        inviting listeners to follow the album's progress via social networks.
        Join the journey.
      </p>
    </section>

    <section class="next-shows" v-if="nextShows.length">
      <h2>Prochains concerts</h2>
      <v-row>
        <v-col v-for="show in nextShows" :key="show.id" cols="12" sm="6" md="4">
          <v-card class="show-card" variant="outlined">
            <v-card-title>{{ show.label }}</v-card-title>
            <v-card-subtitle>{{ show.getFormattedDate() }}</v-card-subtitle>
            <v-card-text v-if="show.venue">
              <v-icon size="small">mdi-map-marker</v-icon>
              {{ show.venue.name }} — {{ show.venue.city }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-btn variant="text" to="/shows" class="mt-4 btn-accent" data-testid="view-all-shows">
        Voir tous les concerts
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </section>

    <v-alert v-if="store.error" type="error" class="mt-4">{{
      store.error
    }}</v-alert>
  </PublicLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import PublicLayout from "@/components/layout/PublicLayout.vue";
import { useShowStore } from "@/stores/showStore";

const store = useShowStore();

onMounted(() => store.load());

const nextShows = computed(() =>
  store.shows
    .filter((s) => s.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3),
);
</script>

<style scoped>
.hero-text {
  text-align: center;
  padding: 3rem 0 2rem;
}

.artist-name {
  font-size: 3.5rem;
  font-weight: 300;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.tagline {
  font-size: 1.2rem;
  color: #aaa;
  margin-top: 0.5rem;
  letter-spacing: 0.05em;
}

.next-shows {
  margin-top: 3rem;
}

.next-shows h2 {
  font-size: 1.4rem;
  font-weight: 400;
  margin-bottom: 1.5rem;
  color: #ddd;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.show-card {
  border-color: #333 !important;
  background: #222 !important;
  height: 100%;
}

.btn-accent {
  color: var(--color-accent) !important;
}
</style>
