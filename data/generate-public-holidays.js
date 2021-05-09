const parse = require('csv-parse/lib/sync');
const {readFileSync, writeFileSync} = require('fs');


const publicHolidaysByYear = [2021, 2022, 2023]
  .reduce((acc, year) => {
      const csvData = readFileSync(`./data/publicholiday.JP.${year}.csv`, 'utf8');

      const holidayDates = parse(csvData, {columns: true}).map(({Date}) => Date);

      return {...acc, [year]: holidayDates};



    }, {}
  );

writeFileSync(`./data/public-holidays.json`, JSON.stringify(publicHolidaysByYear));
