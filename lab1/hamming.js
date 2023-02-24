function encodeString(string, bitBlockSize) {

    console.log(`The string that will be encoded: ${string}\n`);

    const binary = stringToBinary(string);

    console.log(`String in binary form: ${binary}\n`);

    const bitBlocks = splitIntoBitBlocks(binary, bitBlockSize);

    console.log(`This string, which is represented in binary form, we divide into blocks of size ${bitBlockSize}\n`);

    console.log(`As a result, we got the following blocks of bits: `);
    console.log(bitBlocks);

    console.log(`Let's encode each of these blocks: \n`);

    const encodedBitBlocks = encodeBitBlocks(bitBlocks);

    return encodedBitBlocks;
}

function decodeBitBlocks(bitBlocks) {
    return bitBlocks.map(bitBlock => decodeBitBlock(bitBlock)).join('');
}

function decodeBitBlock(bitBlock) {
    console.log(`Bit block to be decoded: {${bitBlock.join(', ')}}`);

    console.log('Remove all control bits from this block, leaving only the data bits.');

    let bitBlockWithoutControlBitIndexes = [];

    const controlBitIndexes = getControlBitIndexes(bitBlock);

    for (let i = 0; i < bitBlock.length; i++) {
        if (!controlBitIndexes.includes(i)) {
            bitBlockWithoutControlBitIndexes.push(bitBlock[i]);
        }
    }

    console.log(`Bit block after all control bits have been removed from it: ` +
    `{${bitBlockWithoutControlBitIndexes.join(', ')}}\n`);

    const binaryString = bitBlockWithoutControlBitIndexes.join('');

    return splitIntoBitBlocks(binaryString, 8)
           .map(bitBlock => bitBlock.join(''))
           .map(string => parseInt(string, 2))
           .map(code => String.fromCodePoint(code))
           .join('');
}

function fixErrorsInBitBlocks(bitBlocks) {
    return bitBlocks.map(bitBlock => {
        return fixErrorInBitBlock(bitBlock);
    })
}

function fixErrorInBitBlock(bitBlock) {
    const initailBitBlock = [...bitBlock];

    console.log(`Check if there is an error in the block: {${bitBlock.join(', ')}}\n`);

    const controlBitIndexes = getControlBitIndexes(bitBlock);

    const informationalBitIndexes = getInformationalBitIndexes(bitBlock, controlBitIndexes);

    const informationalBitsThatControlledByControlBits = getInformationalBitsThatControlledByControlBits(informationalBitIndexes);
    
    bitBlock = calculateControlBits(bitBlock, informationalBitsThatControlledByControlBits);
    
    let sum = 0;
    controlBitIndexes.forEach(controlBitIndex => {
        if (initailBitBlock[controlBitIndex] !== bitBlock[controlBitIndex]) {
            console.log(`\nThe control bit with index ${controlBitIndex + 1} ` +
            `does not match after recalculating the control bits.`);
            sum += (controlBitIndex + 1);
        }
    })

    if (sum > 0) {
        console.log(
            `\nWe sum the positions of the control bits that did not match.\n` + 
            `We get the position of the bit where the error was made. ` +
            `The error was made in the bit with the index ${sum}`
        );

        if (bitBlock[sum - 1] === 1) {
            bitBlock[sum - 1] = 0;
        } else {
            bitBlock[sum - 1] = 1;
        }

        console.log(
            `The bit where the error was made must be inverted, ` + 
            `i.e. to change the value to the opposite.`
        );

        console.log(`After fixing the error we get the following block: { ${bitBlock.join(', ')} }`);
        console.log(`__________________________________________________________________\n`);

    } else {
        console.log('\nNo errors were found.\n');
        console.log(`__________________________________________________________________\n`);
    }

    return bitBlock;
}

function stringToBinary(string) {
    let binary = ''

    string.split('').forEach(symbol => binary += symbolToBinary(symbol));

    return binary;
}

function splitIntoBitBlocks(binary, blockLength) {
    try {
        if (blockLength % 8 !== 0) {
            throw 'The size of the block must be a multiple of 8, because the symbol takes up 8 bits in memory.'
        }

        if (blockLength > binary.length) {
            throw `The block size cannot exceed the number of bits in the string that is encoded. ` + 
            `There are ${binary.length} bits in the line. You have entered a block size is ${blockLength} bit.`;
        }

        let blocks = [], block = [];
        let counter = 0;

        binary.split('').forEach((digit, index) => {
            counter++;
            block.push(Number(digit));

            if (counter === blockLength || index === binary.length - 1) {
                blocks.push(block);
                block = [];
                counter = 0;
            }
        })

        return blocks;

    } catch (error) {
        console.log(error);
        process.exit();
    }
}

function encodeBitBlocks(bitBlocks) {
    return bitBlocks.map(bitBlock => encodeBitBlock(bitBlock));
}

function encodeBitBlock(bitBlock) {

    console.log(`The bit block we will encode: { ${bitBlock.join(', ')} }`)
    const controlBitIndexes = getControlBitIndexes(bitBlock);

    console.log(`Determine at which positions will be the control bits: ${controlBitIndexes.join(', ')}`);

    bitBlock = fillWithTemporaryValuesPlacesWhereControlBits(bitBlock, controlBitIndexes, 'x');

    console.log(`Temporarily fill in empty values those places where there will be control bits.\n` + 
    `As a result, we got the following block: {${bitBlock.join(', ')}}\n`);

    const informationalBitIndexes = getInformationalBitIndexes(bitBlock, controlBitIndexes);

    const informationalBitsThatControlledByControlBits = getInformationalBitsThatControlledByControlBits(informationalBitIndexes);

    const encodedBitBlock = calculateControlBits(
        bitBlock, 
        informationalBitsThatControlledByControlBits
    );

    console.log(`\nBit block after encoding: {${encodedBitBlock.join(', ')}}`)
    console.log(`__________________________________________________________________\n`);

    return encodedBitBlock;
}

function symbolToBinary(symbol) {
    let binary = '';

    binary = symbol.charCodeAt(0).toString(2);

    while (binary.length < 8) {
        binary = '0' + binary;
    }

    return binary;
}

function isPower2(number) {
    for (let i = 0; i <= number; i++) {
        if (2 ** i === number) {
            return true;
        }
    }

    return false;
}

function getControlBitsThatControlsInformationBit(informationBitIndex) {
    const controlBitsIndexes = [];

    const binary = (informationBitIndex + 1).toString(2);

    binary.split('').reverse().forEach((digit, index) => {
        if (digit === '1') {
            controlBitsIndexes.push(2 ** index - 1);
        }
    })

    return controlBitsIndexes;
}

function fillWithTemporaryValuesPlacesWhereControlBits(
    bitBlock, 
    controlBitIndexes, 
    temporaryValue
) {
    Array.prototype.insert = function (index, ...items) {
        this.splice(index, 0, ...items);
    };

    controlBitIndexes.forEach(controlBitIndex => {
        bitBlock.insert(controlBitIndex, temporaryValue);
    })

    return bitBlock;
}

function getControlBitIndexes(bitBlock) {
    let controlBitIndexes = [];

    for (let i = 0; i < bitBlock.length; i++) {
        if (isPower2(i + 1)) {
            controlBitIndexes.push(i);
        }
    }

    return controlBitIndexes;
}

function getInformationalBitIndexes(bitBlock, controlBitIndexes) {
    let informationalBitIndexes = [];

    for (let i = 0; i < bitBlock.length; i++) {
        if (!controlBitIndexes.includes(i)) {
            informationalBitIndexes.push(i);
        }
    }

    return informationalBitIndexes;
}

function getInformationalBitsThatControlledByControlBits(informationalBitIndexes) {
    let informationBitsThatControlledByControlBits = {};

    informationalBitIndexes.forEach(informationalBitIndex => {
        const controlBitsThatControlsInformationBit = getControlBitsThatControlsInformationBit(informationalBitIndex);

        console.log(`Information bit with index ${informationalBitIndex} is checked by control bits ` + 
        `with indexes: ${controlBitsThatControlsInformationBit.join(', ')}`);

        controlBitsThatControlsInformationBit.forEach(controlBitIndex => {

            if (informationBitsThatControlledByControlBits[controlBitIndex]) {
                informationBitsThatControlledByControlBits[controlBitIndex] = [
                    ...informationBitsThatControlledByControlBits[controlBitIndex],
                    informationalBitIndex
                ];
            } else {
                informationBitsThatControlledByControlBits[controlBitIndex] = [informationalBitIndex];
            }

        })
    })

    return informationBitsThatControlledByControlBits;
}

function calculateControlBits(bitBlock, informationalBitsThatControlledByControlBits) {

    console.log(`\nLet's calculate the control bits. To do this, we take each control bit,` + 
    `sum all the information bits it controls`);

    Object.keys(informationalBitsThatControlledByControlBits).forEach(controlBitIndex => {

        process.stdout.write(`Control bit with index ${controlBitIndex} = `);
        let sum = 0;

        informationalBitsThatControlledByControlBits[controlBitIndex].forEach((informationalBitIndex, index) => {
            if (index !== informationalBitsThatControlledByControlBits[controlBitIndex].length - 1) {
                process.stdout.write(`${bitBlock[informationalBitIndex]} + `);
            } else {
                process.stdout.write(`${bitBlock[informationalBitIndex]} = `);
            }
            sum += bitBlock[informationalBitIndex];
        })

        if (sum % 2 === 0) {
            process.stdout.write(`${String(sum)} => The sum is even => bitBlock[${controlBitIndex}] = 0 \n`);
            bitBlock[controlBitIndex] = 0;
        } else {
            process.stdout.write(`${String(sum)} => The sum is odd => bitBlock[${controlBitIndex}] = 1 \n`);
            bitBlock[controlBitIndex] = 1;
        }
    })

    return bitBlock;
}

module.exports = {
    encodeString, 
    decodeBitBlocks,
    fixErrorsInBitBlocks
};

