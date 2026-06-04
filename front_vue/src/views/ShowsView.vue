<template>
  <PublicLayout>
    <h1 class="page-title">Concerts</h1>

    <v-progress-linear v-if="store.loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-if="store.error" type="error" class="mb-4">{{ store.error }}</v-alert>

    <div v-if="!store.loading">
      <section v-if="upcoming.length" class="mb-8">
        <ul class="show-list">
          <li v-for="show in upcoming" :key="show.id" class="show-item">
            <span class="show-line">{{ formatShowLine(show) }}</span>
            <span v-if="show.label" class="show-label">{{ show.label }}</span>
          </li>
        </ul>
      </section>

      <section v-if="past.length">
        <h2 class="section-title muted">Passés</h2>
        <ul class="show-list muted">
          <li v-for="show in past" :key="show.id" class="show-item">
            <span class="show-line">{{ formatShowLine(show) }}</span>
            <span v-if="show.label" class="show-label">{{ show.label }}</span>
          </li>
        </ul>
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
import type { Show } from '@portfolio/shared'

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

function formatShowLine(show: Show): string {
  const d = show.date
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  const zip = show.venue?.zipCode ? ` (${show.venue.zipCode})` : ''
  const venue = show.venue ? `${show.venue.name} — ${show.venue.city}${zip}` : '—'
  const details = show.details ? `  ${show.details}` : ''
  return `${date}  ${venue}${details}`
}
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
.show-list.muted {
  opacity: 0.5;
}

.show-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.show-item {
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.show-item:last-child {
  border-bottom: none;
}

.show-line {
  font-size: 1rem;
  color: #e0e0e0;
  font-variant-numeric: tabular-nums;
}

.show-label {
  font-size: 0.85rem;
  color: #888;
  font-style: italic;
}

.empty {
  color: #666;
  text-align: center;
  margin-top: 4rem;
}
</style>
