<template>
  <div class="admin-sidebar">
    <nav>
      <ul>
        <li><NuxtLink to="/" active-class="active-link">Accueil</NuxtLink></li>
        <li>
          <NuxtLink to="/auboulot/shows" active-class="active-link"
            >Shows</NuxtLink
          >
        </li>
        <li>
          <NuxtLink to="/auboulot/venues" active-class="active-link"
            >Venues</NuxtLink
          >
        </li>
        <li>
          <v-btn
            variant="outlined"
            color="red"
            size="small"
            class="logout-btn"
            @click="logout()"
            >Logout</v-btn
          >
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { useAuth } from "../../composables/authComposable";
const { logout } = useAuth();
</script>

<style lang="scss" scoped>
.admin-sidebar {
  min-width: 10rem;
}
ul {
  list-style: none;
  li a {
    text-decoration: none;
    color: #000000;
    &.active-link {
      font-weight: bold;
    }
  }
  a:hover {
    opacity: 0.8;
  }
}

.logout-btn {
  margin-top: 1rem;
}
</style>
