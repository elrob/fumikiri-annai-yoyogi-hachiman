const {readFileSync, writeFileSync} = require('fs');
const {SHINJUKU} = require('./constants');

const originalTimetable = JSON.parse(readFileSync('timetable-holiday.json', 'utf8'));

const repairSuperHakoneShinjukuDepartureTimes = {
    'Super Hakone 5': '09:00',
    'Super Hakone 7': '10:00',
    'Super Hakone 9': '10:20',
    'Super Hakone 11': '11:00'
};

const repair = train => {
    const {tt, nm} = train;
    const {s, a, d} = tt && tt.find(({s}) => s === SHINJUKU) || {};
    if (s && !a && !d) {
        const [{en}] = nm;
        const departureTime = repairSuperHakoneShinjukuDepartureTimes[en];
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

writeFileSync('relevant-timetable-holiday.json', relevantTimetableJsonString);

