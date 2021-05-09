const {readFileSync, writeFileSync} = require('fs');
const {SANGUBASHI, SHINJUKU, YOYOGI_HACHIMAN, YOYOGI_UEHARA} = require('./constants');
const averageTimes = require('./calculateEstimates');

[
  'weekday',
  'holiday'
]
  .forEach(timetable => {
      const relevantTimetable = JSON.parse(readFileSync(`./data/relevant-timetable-${timetable}.json`, 'utf8'));

      const TIMETABLE_DAY_SWITCH_HOUR = 3;
      const ONE_SECOND_MILLIS = 1000;
      const ONE_MINUTE_SECONDS = 60;
      const ONE_MINUTE_MILLIS = ONE_MINUTE_SECONDS * ONE_SECOND_MILLIS;
      const ONE_HOUR_MINUTES = 60;
      const ONE_HOUR_MILLIS = ONE_HOUR_MINUTES * ONE_MINUTE_MILLIS;

      const timeStringToEpochMillis = time => {
        const [hour, minute] = time.split(':');
        const hours = parseInt(hour);
        const trainTimetableHours = hours >= TIMETABLE_DAY_SWITCH_HOUR ? hours : hours + 24;
        const minutes = parseInt(minute);
        return (trainTimetableHours * ONE_HOUR_MILLIS) + (minutes * ONE_MINUTE_MILLIS);
      };

      const timetableSwitchTimeEpochMillis = timeStringToEpochMillis(`${TIMETABLE_DAY_SWITCH_HOUR}:00`);

      const getEstimatedTimes = (isInbound, isStopping, isStoppingAtUehara, hachiman, uehara, shinjuku) =>
        isInbound
          ? (isStopping
            ? {
              estimatedClose:
                timeStringToEpochMillis(hachiman.a)
                -
                (averageTimes.inbound.stopping.inboundBeforeHachimanArrClose * ONE_SECOND_MILLIS),
              estimatedOpen:
                timeStringToEpochMillis(hachiman.a)
                +
                (averageTimes.inbound.stopping.inboundAfterHachimanArrOpen * ONE_SECOND_MILLIS)
            }
            : (isStoppingAtUehara
                ? {
                  estimatedClose:
                    timeStringToEpochMillis(uehara.d)
                    +
                    (averageTimes.inbound.through.inboundAfterUeharaDepClose * ONE_SECOND_MILLIS),
                  estimatedOpen:
                    timeStringToEpochMillis(uehara.d)
                    +
                    (averageTimes.inbound.through.inboundAfterUeharaDepOpen * ONE_SECOND_MILLIS)
                }
                : {
                  estimatedClose:
                    timeStringToEpochMillis(shinjuku.a)
                    -
                    (averageTimes.inbound.through.inboundBeforeShinjukuArrClose * ONE_SECOND_MILLIS),
                  estimatedOpen:
                    timeStringToEpochMillis(shinjuku.a)
                    -
                    (averageTimes.inbound.through.inboundBeforeShinjukuArrOpen * ONE_SECOND_MILLIS)
                }
            )
          )
          : (isStopping
            ? {
              estimatedClose:
                timeStringToEpochMillis(hachiman.a)
                -
                (averageTimes.outbound.stopping.outboundBeforeHachimanArrClose * ONE_SECOND_MILLIS),
              estimatedOpen:
                timeStringToEpochMillis(hachiman.d)
                +
                (averageTimes.outbound.stopping.outboundAfterHachimanDepOpen * ONE_SECOND_MILLIS)
            }
            : (isStoppingAtUehara
                ? {
                  estimatedClose:
                    timeStringToEpochMillis(uehara.a)
                    -
                    (averageTimes.outbound.through.outboundBeforeUeharaArrClose * ONE_SECOND_MILLIS),
                  estimatedOpen:
                    timeStringToEpochMillis(uehara.a)
                    -
                    (averageTimes.outbound.through.outboundBeforeUeharaArrOpen * ONE_SECOND_MILLIS)
                }
                : {
                  estimatedClose:
                    timeStringToEpochMillis(shinjuku.d)
                    +
                    (averageTimes.outbound.through.outboundAfterShinjukuDepClose * ONE_SECOND_MILLIS),
                  estimatedOpen:
                    timeStringToEpochMillis(shinjuku.d)
                    +
                    (averageTimes.outbound.through.outboundAfterShinjukuDepOpen * ONE_SECOND_MILLIS)
                }
            )
          );

      const yoyogiHachimanTime = train => {
        const {tt, d} = train;
        const {s: i0, ...hachiman} = tt && tt.find(({s}) => s === YOYOGI_HACHIMAN) || {};
        const {s: i1, ...sangubashi} = tt && tt.find(({s}) => s === SANGUBASHI) || {};
        const {s: i2, ...shinjuku} = tt && tt.find(({s}) => s === SHINJUKU) || {};
        const {s: i3, ...uehara} = tt && tt.find(({s}) => s === YOYOGI_UEHARA) || {};
        const isInbound = d === 'Inbound';
        const isStopping = !!hachiman.a;
        const isStoppingAtUehara = !!uehara.a;
        const isExpress = Object.keys(uehara).length === 0;
        const estimatedTimes = getEstimatedTimes(isInbound, isStopping, isStoppingAtUehara, hachiman, uehara, shinjuku);
        return {hachiman, isInbound, isExpress, sangubashi, shinjuku, uehara, ...estimatedTimes};
      };

      const relevantTrainsWithEstimatedCloseOpenTimes =
        relevantTimetable.map(t => yoyogiHachimanTime(t))
          .filter(({estimatedClose}) => estimatedClose)
          .sort(({estimatedClose: a}, {estimatedClose: b}) => a - b);

      const outbound =
        relevantTrainsWithEstimatedCloseOpenTimes
          .filter(({isInbound}) => !isInbound)
          .map(({estimatedClose, estimatedOpen}) => [estimatedClose, estimatedOpen]);

      const inbound =
        relevantTrainsWithEstimatedCloseOpenTimes
          .filter(({isInbound}) => isInbound)
          .map(({estimatedClose, estimatedOpen}) => [estimatedClose, estimatedOpen]);

      const getTimeline = (timelineAgg, trains) => {
        if (!trains.length) {
          return timelineAgg;
        }
        const [isClosed] = timelineAgg[timelineAgg.length - 1];
        const [firstTrain, ...rest] = trains;
        const secondTrain = rest.length ? rest[0] : undefined;
        if (isClosed) {
          if (firstTrain[1] < (secondTrain ? secondTrain[1] : 0)) {
            return getTimeline([...timelineAgg, [false, firstTrain[1]]], rest);
          } else {
            return getTimeline(timelineAgg, rest);
          }
        } else {
          return getTimeline([...timelineAgg, [true, firstTrain[0]]], trains);
        }
      };

      const inboundTimeline = getTimeline([[true, inbound[0][0]]], inbound)
      const outboundTimeline = getTimeline([[true, outbound[0][0]]], outbound)

      const resolveTimeline = (timelineAgg, {inboundTimeline, outboundTimeline}) => {
        if (!inboundTimeline.length || !outboundTimeline.length) {
          return timelineAgg;
        }
        const {outboundState, inboundState, time} = timelineAgg[timelineAgg.length - 1];
        const [[firstInboundState, firstInboundTime], ...restInbound] = inboundTimeline;
        const [[firstOutboundState, firstOutboundTime], ...restOutbound] = outboundTimeline;
        if (firstInboundTime < time) {
          return resolveTimeline(timelineAgg, {inboundTimeline: restInbound, outboundTimeline});
        } else if (firstOutboundTime < time) {
          return resolveTimeline(timelineAgg, {inboundTimeline, outboundTimeline: restOutbound});
        }

        if (firstInboundTime < firstOutboundTime) {
          return resolveTimeline(
            [...timelineAgg, {
              outboundState,
              inboundState: firstInboundState,
              overallState: outboundState || firstInboundState,
              time: firstInboundTime
            }],
            {inboundTimeline: restInbound, outboundTimeline});
        } else {
          return resolveTimeline(
            [...timelineAgg, {
              inboundState,
              outboundState: firstOutboundState,
              overallState: inboundState || firstOutboundState,
              time: firstOutboundTime
            }],
            {inboundTimeline, outboundTimeline: restOutbound});
        }
      };

      const openCloseTimeline = resolveTimeline(
        [{outboundState: false, inboundState: false, overallState: false, time: timetableSwitchTimeEpochMillis}],
        {inboundTimeline, outboundTimeline})
        .reduce((agg, cur) => {
          if (!agg.length) {
            return [cur];
          }
          return agg[agg.length - 1].overallState !== cur.overallState ? [...agg, cur] : agg;
        }, [])
        .map(({overallState, time}, index, array) => ({
          overallState,
          time,
          durationSeconds: array[index + 1] ? (array[index + 1].time - time) / ONE_SECOND_MILLIS : ONE_MINUTE_SECONDS
        }));

      const lastTrain = openCloseTimeline[openCloseTimeline.length - 1];

      const lastTrainPassedTime = lastTrain.time + (lastTrain.durationSeconds * ONE_SECOND_MILLIS);
      const endOfDayOpenPeriod = {
        overallState: false,
        time: lastTrainPassedTime,
        durationSeconds: (timetableSwitchTimeEpochMillis - lastTrainPassedTime + (24 * ONE_HOUR_MILLIS)) / ONE_SECOND_MILLIS
      };

      const resolvedTimeline = [...openCloseTimeline, endOfDayOpenPeriod];

      const epochMillisToHumanTimeString = epochMillis => new Date(epochMillis).toTimeString();

      console.log(JSON.stringify({
        resolvedTimeline: resolvedTimeline.map(({overallState, time, durationSeconds}) => ({
          state: overallState ? "closed" : "open",
          time: epochMillisToHumanTimeString(time),
          durationSeconds
        }))
      }, null, 2));


      writeFileSync(`./data/open-close-times-${timetable}.json`, JSON.stringify(resolvedTimeline));
    }
  );
