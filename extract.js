const {readFileSync, writeFileSync} = require('fs');
const {SHINJUKU} = require('./constants');

const SUPER_HAKONE_SHINKUKU_DEPARTURE_TIMES = {
    weekday: {
        'Super Hakone 7': '10:00',
        'Super Hakone 9': '11:00'
    },
    holiday: {
        'Super Hakone 5': '09:00',
        'Super Hakone 7': '10:00',
        'Super Hakone 9': '10:20',
        'Super Hakone 11': '11:00'
    }
};

[
    ['timetable-weekday.json', SUPER_HAKONE_SHINKUKU_DEPARTURE_TIMES.weekday],
    ['timetable-holiday.json', SUPER_HAKONE_SHINKUKU_DEPARTURE_TIMES.holiday]
].forEach(([originalTimetableFileName, superHakoneShinjukuDepartureTimes]) => {
    const originalTimetable = JSON.parse(readFileSync(originalTimetableFileName, 'utf8'));

    const repair = train => {
        const {tt, nm} = train;
        const {s, a, d} = tt && tt.find(({s}) => s === SHINJUKU) || {};
        if (s && !a && !d) {
            const [{en}] = nm;
            const departureTime = superHakoneShinjukuDepartureTimes[en];
            const repairedTimetable =
                tt.map(stationTime => stationTime.s === SHINJUKU ? {...stationTime, d: departureTime} : stationTime);
            const afterRepair = {...train, tt: repairedTimetable};
            console.log(JSON.stringify({beforeRepair: train, afterRepair}, null, 2));
            return afterRepair;
        }
        return train;
    };
    const relevantTimetable = originalTimetable
        .filter(({tt}) => tt && tt.find(({s}) => s === SHINJUKU))
        .map(repair);

    const relevantTimetableJsonString = JSON.stringify(relevantTimetable, null, 2);

    writeFileSync(`relevant-${originalTimetableFileName}`, relevantTimetableJsonString);
})

