const fs = require('fs');
const readline = require('readline');
const path = require('path');

// TODO convert filepath to command line arguments
async function checkReviews() {
  const inpathing = path.join(__dirname, '../data/reviews.csv');
  const instream = fs.createReadStream(inpathing);

  const rl = readline.createInterface({
    input: instream,
    crlfDelay: Infinity
  });

  let max = 0;
  let counter = 0;
  rl.on('line', (line) => {
    const row = line.split(',');
    const id = row[0];
    console.log(counter);
    if (row.length !== 12) return;
    if (isNaN(row[1])) return;
    if (isNaN(row[2]) || row[2] > 5 || row[2] < 0) return;
    if (!isValidDate(row[3])) return;
    if (row[4].length > 62) return;
    if (row[5].length < 52) return;
    if (row[5].length > 1002) return;
    if (row[6] != 0 && row[6] != 1 && row[6] !== 'true' && row[6] !== 'false') return;
    if (isNaN(row[7]) && row[7] !== 'true' && row[7] !== 'false') return;
    if (row[8].length > 62) return;
    if (row[9].length > 62) return;
    if (row[10].length > 122) return;
    if (isNaN(row[11]) || row[11] < 0) return;
    counter++;
    console.log(counter);
  });
}

function isValidDate(input) {
  input = input.split('"').join('');
  const sections = input.split('-');
  if (sections.length !== 3) return false;
  if (isNaN(sections[0])) return false;
  if (isNaN(sections[1])) return false;
  if (sections[1] > 12 || sections[1] < 1) return false;
  if (sections[2] > 31 || sections[2] < 1) return false;
  return true;
}

checkReviews();

console.log('hi');