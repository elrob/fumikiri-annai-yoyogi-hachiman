<template>
  <header>
    <h1>踏切案内 代々木八幡</h1>
    <span class="header-2">{{ displayTime }}</span>
    <span class="header-2">{{ currentState ? 'Closed' : 'Open' }}</span>
  </header>
  <main id="timeline">
    <hr id="now-marker">
    <ul id="open-close-times-list">
      <li
          v-for="(openCloseTime, index) in openCloseTimes"
          :key="openCloseTime.time"
          class="state-panel"
          :class="openCloseTime.overallState ? 'closed' : 'open'"
          :style="{ height: (0.1 * openCloseTime.durationSeconds)  + 'em' }"
      >
        {{ index !== 0 ? new Date(openCloseTime.time).toLocaleTimeString('ja-JP') : null }}
      </li>
    </ul>
  </main>
</template>

<script>
import openCloseTimes from '../open-close-times-holiday.json'

const secondsToMillis = seconds => seconds * 1000;
const millisToSeconds = millis => Math.floor(millis / 1000);

const getDisplayableCurrentTime = () => new Date().toLocaleTimeString('ja-JP')

const getCurrentStateAndTimeline = () => {
  const now = secondsToMillis(millisToSeconds(Date.now()));
  const startOfDay = new Date(now).setHours(0,0,0,0);
  const lowerBound = now - secondsToMillis(30);
  const upperBound = now + secondsToMillis(3600);
  const filteredOpenCloseTimes = openCloseTimes
      .filter(({durationSeconds}) => durationSeconds > 0)
      .map(({time, ...rest}) => ({...rest, time: time + startOfDay}))
      .filter(({time}, index, times) =>
          time >= lowerBound && time < upperBound
          || (times[index + 1] && times[index + 1].time >= lowerBound && times[index + 1].time < upperBound))
      .map((openCloseTime, index, times) => index === 0 && times[index + 1]
          ? {...openCloseTime, durationSeconds: millisToSeconds(times[index + 1].time - lowerBound)}
          : openCloseTime);
  const currentState = filteredOpenCloseTimes
      .find(({time}, index, times) => time <= now && times[index + 1] && times[index + 1].time > now)
      ?.overallState;
  return {openCloseTimes: filteredOpenCloseTimes, currentState};
}


export default {
  name: 'App',
  data() {
    const {openCloseTimes, currentState} = getCurrentStateAndTimeline();
    return {
      clockInterval: null,
      displayTime: getDisplayableCurrentTime(),
      openCloseTimes,
      currentState
    }
  },
  beforeUnmount() {
    clearInterval(this.clockInterval)
  },
  created() {
    const that = this;
    this.clockInterval = setInterval(() => {
      that.displayTime = getDisplayableCurrentTime()
    }, 1000);
    this.refreshDisplayInterval = setInterval(() => {
      const {openCloseTimes, currentState} = getCurrentStateAndTimeline();
      that.currentState = currentState;
      that.openCloseTimes = openCloseTimes;
    }, 1000)
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

.header-2 {
  display: inline-block;
  width: 50%;
}

#timeline {
  padding: 5em 0 0;
}

#now-marker {
  height: 0.2em;
  color: #082A5B;
  background: #082A5B;
  margin: 3em 0 0 0;
  width: 100%;
  position: fixed;
}

#open-close-times-list {
  margin: 0;
  padding: 0;
  z-index: -1;
  list-style-type: none;
}

.state-panel {
  border-bottom: 0.35em solid #DEF7FF;
  padding-left: 0.4em
}

.open {
  background-color: #D7F8C3;
}

.closed {
  background-color: #E3E3E3;
}

</style>
