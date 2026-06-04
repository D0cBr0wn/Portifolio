<template>
  <div class="public-layout">
    <header class="public-header">
      <router-link to="/">
        <img src="@/assets/logo.png" alt="Portfolio" class="logo" />
      </router-link>
      <nav>
        <router-link to="/">Accueil</router-link>
        <router-link to="/shows">Concerts</router-link>
      </nav>
    </header>
    <main class="public-content">
      <slot />
    </main>
    <footer class="public-footer">
      <p>&copy; {{ new Date().getFullYear() }} Portfolio</p>
    </footer>
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  color: #ffffff;
}

.public-header {
  height: 300px;
  background-image: url("@/assets/bg.jpg");
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.logo {
  max-width: 400px;
  max-height: 200px;
  object-fit: contain;
}

nav {
  display: flex;
  gap: 2rem;
}

nav a {
  color: #ffffff;
  text-decoration: none;
  font-size: 1.1rem;
}

nav a.router-link-active {
  border-bottom: 2px solid var(--color-accent-menu);
}

.public-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.public-footer {
  padding: 1rem 2rem;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
}
</style>
