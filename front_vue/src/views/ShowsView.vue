<template>
  <PublicLayout>
    <h1 class="page-title">Concerts</h1>

    <v-progress-linear v-if="store.loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-if="store.error" type="error" class="mb-4">{{ store.error }}</v-alert>

    <div v-if="!store.loading">
      <section v-if="upcoming.length" class="mb-8">
        <h2 class="section-title">À venir</h2>
        <v-table class="shows-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Concert</th>
              <th>Lieu</th>
              <th>Ville</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="show in upcoming" :key="show.id">
              <td class="date-col">{{ show.getFormattedDate() }}</td>
              <td>{{ show.label }}</td>
              <td>{{ show.venue?.name ?? '—' }}</td>
              <td>{{ show.venue?.city ?? '—' }}</td>
            </tr>
          </tbody>
        </v-table>
      </section>

      <section v-if="past.length">
        <h2 class="section-title muted">Passés</h2>
        <v-table class="shows-table muted">
          <thead>
            <tr>
              <th>Date</th>
              <th>Concert</th>
              <th>Lieu</th>
              <th>Ville</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="show in past" :key="show.id">
              <td class="date-col">{{ show.getFormattedDate() }}</td>
              <td>{{ show.label }}</td>
              <td>{{ show.venue?.name ?? '—' }}</td>
              <td>{{ show.venue?.city ?? '—' }}</td>
            </tr>
          </tbody>
        </v-table>
      </section>

      <p v-if="!upcoming.length && !past.length" class="empty">
        Aucun concert pour le moment.
      </p>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { useShowStore } from '@/stores/showStore'

const store = useShowStore()

onMounted(() => store.load())

const upcoming = computed(() =>
  store.shows
    .filter(s => s.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
)

const past = computed(() =>
  store.shows
    .filter(s => s.date < new Date())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
)
</script>

<style scoped>
.page-title {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #BB86FC;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #aaa;
  margin-bottom: 1rem;
}

.section-title.muted,
.shows-table.muted {
  opacity: 0.5;
}

.shows-table {
  background: transparent !important;
}

.date-col {
  white-space: nowrap;
  color: #BB86FC;
  font-variant-numeric: tabular-nums;
}

.empty {
  color: #666;
  text-align: center;
  margin-top: 4rem;
}
</style>
