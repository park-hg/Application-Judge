const fs = require('fs');

const totalInputDict = JSON.parse(fs.readFileSync('./inputs.txt'));
const totalOutputDict = JSON.parse(fs.readFileSync('./outputs.txt'));


module.exports = {
    totalInputDict,
    totalOutputDict,
}