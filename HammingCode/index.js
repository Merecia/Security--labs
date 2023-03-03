const fs = require('fs');
const {
    encodeString,
    decodeBitBlocks,
    fixErrorsInBitBlocks
} = require('./hamming');

function encode(input, output) {
    try {
        const textFromFile = fs.readFileSync(input, 'utf8');

        const bitBlockSize = 16;

        const bitBlocks = encodeString(textFromFile, bitBlockSize);

        fs.writeFileSync(output, JSON.stringify(bitBlocks, null, '\t'));

    } catch (error) {
        console.error(error);
    }
}

function decode(input, output) {
    try {
        const bitBlocks = JSON.parse(fs.readFileSync(input, 'utf8'));

        const text = decodeBitBlocks(bitBlocks);

        fs.writeFileSync(output, text);

    } catch (error) {
        console.log(error);
    }
}

function fixErrors(input, output) {
    try {
        let bitBlocks = JSON.parse(fs.readFileSync(input, 'utf8'));

        bitBlocks = fixErrorsInBitBlocks(bitBlocks);

        fs.writeFileSync(output, JSON.stringify(bitBlocks, null, '\t'));

    } catch (error) {
        console.log(error);
    }
}

encode('file1.txt', 'file2.txt');
fixErrors('file2.txt', 'file3.txt');
decode('file3.txt', 'file4.txt');
