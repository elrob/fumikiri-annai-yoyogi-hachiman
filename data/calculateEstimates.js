const parse = require('csv-parse/lib/sync');
const {readFileSync} = require('fs');

const csvData = readFileSync('fumikiri-annai - YoyogiHachimanFumikiri1.csv', 'utf8');

const records = parse(csvData, {columns: true});

const timeDataFields = [
    'outboundAfterShinjukuDepClose',
    'outboundAfterShinjukuDepOpen',
    'outboundBeforeUeharaArrClose',
    'outboundBeforeUeharaArrOpen',
    'outboundBeforeHachimanArrClose',
    'outboundBeforeHachimanDepClose',
    'outboundAfterHachimanDepOpen',
    'inboundBeforeShinjukuArrClose',
    'inboundBeforeShinjukuArrOpen',
    'inboundAfterUeharaDepClose',
    'inboundAfterUeharaDepOpen',
    'inboundBeforeHachimanArrClose',
    'inboundBeforeHachimanDepClose',
    'inboundAfterHachimanArrOpen',
    'inboundBeforeHachimanDepOpen'
];

const resolveStoppingOrThrough = ({stopping, through}, cur) => ({
    stopping: cur.stopping ? [...stopping, cur] : stopping,
    through: cur.stopping ? through : [...through, cur]
});

const groupedRecords = records
    .map(({isInbound, hachimanArr, ...rest}) => timeDataFields
        .reduce((agg, field) => ({
                ...agg,
                [field]: rest[field] ? parseInt(rest[field]) : null
            }),
            {inbound: isInbound === '1', stopping: hachimanArr !== ''}))
    .reduce(({inbound, outbound}, cur) => ({
        inbound: cur.inbound ? resolveStoppingOrThrough(inbound, cur) : inbound,
        outbound: cur.inbound ? outbound : resolveStoppingOrThrough(outbound, cur)
    }), {inbound: {stopping: [], through: []}, outbound: {stopping: [], through: []}})

const averageTimesByInboundOutboundStoppingThrough =
    Object.fromEntries(['inbound', 'outbound'].map(inboundOutbound =>
        [inboundOutbound, Object.fromEntries(['stopping', 'through'].map(stoppingThrough =>
            [stoppingThrough, Object.fromEntries(timeDataFields.map(field => {
                const values = groupedRecords[inboundOutbound][stoppingThrough]
                    .map(record => record[field])
                    .filter(value => value);
                const average = Math.floor(values.reduce((sum, v) => sum + v, 0) / values.length);
                return [field, average];
            }))]
        ))]
    ));

module.exports = averageTimesByInboundOutboundStoppingThrough;
