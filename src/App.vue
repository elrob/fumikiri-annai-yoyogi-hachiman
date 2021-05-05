<template>
  <header>
    <h1>踏切案内 代々木八幡</h1>
    {{ displayTime }}
  </header>
  <ul id="timeline">
    <li
        v-for="(state, index) in states"
        :key="index"
        class="state-panel"
        :class="state.overallState ? 'closed' : 'open'"
        :style="{ height: (0.15 * state.durationSeconds)  + 'em' }"
    >
      {{ new Date(state.time).toLocaleTimeString('ja-JP') }}
    </li>
  </ul>
</template>

<script>
import resolvedTimeline from '../relevant-trains-now.json'

const getDisplayableCurrentTime = () => new Date().toLocaleTimeString('ja-JP')

export default {
  name: 'App',
  data() {
    return {
      interval: null,
      displayTime: getDisplayableCurrentTime(),
      states: resolvedTimeline.filter(({durationSeconds}) => durationSeconds > 0)
    }
  },
  beforeUnmount() {
    clearInterval(this.interval)
  },
  created() {
    const that = this;
    this.interval = setInterval(() => {
      that.displayTime = getDisplayableCurrentTime()
    }, 1000);
  }
}
</script>

<style>
body {
  margin: 0
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

header {
  height: 5em;
  position: fixed;
  top: 0;
  width: 100%;
  background: white;
  text-align: center;
}

header > h1 {
  margin: 0.1em;
  letter-spacing: 0.1em;
}

#timeline {
  margin: 0;
  padding: 5em 0 0;
  list-style-type: none;
}

.state-panel {
  border-bottom: 0.35em solid #DEF7FF;
  padding: 0.4em
}

.open {
  background-color: #D7F8C3;
}

.closed {
  background-color: #E3E3E3;
}

</style>
