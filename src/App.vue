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
import openCloseTimesHoliday from '../data/open-close-times-holiday.json'
import openCloseTimesWeekday from '../data/open-close-times-weekday.json'
import publicHolidays from '../data/public-holidays.json'

const secondsToMillis = seconds => seconds * 1000;
const millisToSeconds = millis => Math.floor(millis / 1000);
const ONE_HOUR_SECONDS = 60 * 60;
const ONE_DAY_MILLIS = secondsToMillis(24 * ONE_HOUR_SECONDS);
const TIMETABLE_DAY_SWITCH_HOUR = 3;

const FAKE_NOW_MILLIS =
    // normal:
    undefined;
    // for testing:
    // new Date("2021-05-10T00:00:00Z");

const getNowDate = () => new Date(FAKE_NOW_MILLIS || new Date().setMilliseconds(0));
const getNowMillis = () => getNowDate().getTime();

const getDisplayableCurrentTime = () => getNowDate().toLocaleTimeString('ja-JP')

const getCurrentStateAndTimeline = () => {
  const nowMillis = getNowMillis();
  const lowerBound = nowMillis - secondsToMillis(30);
  const upperBound = nowMillis + secondsToMillis(ONE_HOUR_SECONDS);

  const startOfTimetableDay = new Date(new Date(nowMillis).getHours() >= TIMETABLE_DAY_SWITCH_HOUR ? nowMillis : nowMillis - ONE_DAY_MILLIS)
      .setHours(0, 0, 0, 0);
  const startOfTimetableDayDate = new Date(startOfTimetableDay);
  const isHoliday = [0, 6].includes(startOfTimetableDayDate.getDay()) // Sunday or Saturday
      || publicHolidays[startOfTimetableDayDate.getFullYear()]
          .includes(new Date(startOfTimetableDayDate.setHours(9)).toISOString().split('T')[0]);

  const filteredOpenCloseTimes = (isHoliday ? openCloseTimesHoliday : openCloseTimesWeekday)
      .filter(({durationSeconds}) => durationSeconds > 0)
      .map(({time, ...rest}) => ({...rest, time: time + startOfTimetableDay}))
      .filter(({time}, index, times) =>
          time >= lowerBound && time < upperBound
          || (times[index + 1] && times[index + 1].time >= lowerBound && times[index + 1].time < upperBound))
      .map((openCloseTime, index, times) => index === 0 && times[index + 1]
          ? {...openCloseTime, durationSeconds: millisToSeconds(times[index + 1].time - lowerBound)}
          : openCloseTime);

  const adjustedFilteredOpenCloseTimes = filteredOpenCloseTimes.length
      ? filteredOpenCloseTimes
      : [{time: lowerBound, overallState: false, durationSeconds: millisToSeconds(upperBound - lowerBound)}];
  const currentState = adjustedFilteredOpenCloseTimes
      .find(({time}, index, times) => time <= nowMillis && times[index + 1] && times[index + 1].time > nowMillis)
      ?.overallState || false;
  return {openCloseTimes: adjustedFilteredOpenCloseTimes, currentState};
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
    }, secondsToMillis(1));
    this.refreshDisplayInterval = setInterval(() => {
      const {openCloseTimes, currentState} = getCurrentStateAndTimeline();
      that.currentState = currentState;
      that.openCloseTimes = openCloseTimes;
    }, secondsToMillis(2))
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
