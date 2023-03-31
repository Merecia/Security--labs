const {
    initialMessagePermutation,
    initialKeyPermutaion,
    subKeyPermutation,
    messageExpansion,
    S1, S2, S3, S4, S5, S6, S7, S8,
    rightSubMessagePermutation,
    finalMessagePermutation,
    shiftsTable
} = require('./tables');

const {
    BLOCK_SIZE,
    SMALL_BLOCK_SIZE,
    PLAINTEXT_LENGTH_MULTIPLICITY,
    HEX_LENGTH_MULTIPLICITY
} = require('./constants');

function symbolToBinary(symbol, binarySize) {
    try {
        if (
            (typeof symbol === 'string' || typeof symbol === 'String')
            && symbol.length === 1
        ) {
            let binary = String(symbol).charCodeAt(0).toString(2);

            if (binarySize) {
                while (binary.length < binarySize) {
                    binary = '0' + binary;
                }
            }

            return binary;
        } else {
            throw new Error('The function argument must be a symbol');
        }
    } catch (exception) {
        console.log(exception);
        process.exit();
    }
}

function decimalToBinary(decimal, binarySize) {
    try {
        if (typeof decimal === 'number' || typeof decimal === 'Number') {
            let binary = decimal.toString(2);

            if (binarySize) {
                while (binary.length < binarySize) {
                    binary = '0' + binary;
                }
            }

            return binary;
        } else {
            throw new Error('The function argument must be a number');
        }
    } catch (exception) {
        console.log(exception);
        process.exit();
    }
}

function permutation(bitBlock, permutationTable) {
    return permutationTable.map(element => bitBlock[element - 1]);
}

function divideBlockIntoTwoParts(block) {
    const leftPart = block.slice(0, block.length / 2);

    const rightPart = block.slice(block.length / 2, block.length);

    return [leftPart, rightPart];
}

function joinBlocks(firstBlock, secondBlock) {
    secondBlock.forEach(element => firstBlock.push(element));

    return firstBlock;
}

function cyclicShift(bitBlock, shift) {
    const copy = [...bitBlock];

    const removedPart = copy.splice(0, shift);

    removedPart.forEach(element => copy.push(element));

    return copy;
}

function XOR(firstBlock, secondBlock) {
    try {
        if (firstBlock.length !== secondBlock.length) {
            throw new Error(`The number of elements in the arrays must match`);
        }

        firstBlock.forEach(element => {
            if (element !== 0 && element !== 1) {
                throw new Error(`
                    Arrays passed to the function must contain only zeros and ones. 
                    The first array contains something other than zeros and ones.
                `);
            }
        })

        secondBlock.forEach(element => {
            if (element !== 0 && element !== 1) {
                throw new Error(`
                    Arrays passed to the function must contain only zeros and ones. 
                    The second array contains something other than zeros and ones.
                `);
            }
        })

        let result = [];

        for (let i = 0; i < firstBlock.length; i++) {
            if (
                firstBlock[i] === 1 && secondBlock[i] === 0 ||
                firstBlock[i] === 0 && secondBlock[i] === 1
            ) {
                result[i] = 1;
            } else {
                result[i] = 0;
            }
        }

        return result;

    } catch (exception) {
        console.log(exception);
        process.exit(-1);
    }
}

function splitBigBlockIntoSmallBlocks(bigBlock, smallBlockLength) {
    try {
        if (bigBlock.length % smallBlockLength !== 0) {
            throw `The length of the big block must be a multiple of the length of the small block`;
        }

        if (smallBlockLength > bigBlock.length) {
            throw `The size of the small block should not exceed the size of the large block`
        }

        let smallBlocks = [], smallBlock = [];
        let counter = 0;

        bigBlock.forEach((element, index) => {
            counter++;
            smallBlock.push(element);

            if (counter === smallBlockLength || index === bigBlock.length - 1) {
                smallBlocks.push(smallBlock);
                smallBlock = [];
                counter = 0;
            }
        })

        return smallBlocks;

    } catch (error) {
        console.log(error);
        process.exit();
    }
}

function smallBlockProcessing(smallBlock, index) {
    try {
        if (smallBlock.length !== SMALL_BLOCK_SIZE) {
            throw new Error(`Small block size should be equal to ${SMALL_BLOCK_SIZE}`);
        }

        let columnIndexBinary = '', rowIndexBinary = '';

        rowIndexBinary = String(smallBlock[0]) + String(smallBlock[5]);
        for (let i = 1; i <= 4; i++) columnIndexBinary += String(smallBlock[i]);

        const columnIndex = parseInt(columnIndexBinary, 2);
        const rowIndex = parseInt(rowIndexBinary, 2);

        let smallBlockTables = [S1, S2, S3, S4, S5, S6, S7, S8];
        const smallBlockTable = smallBlockTables[index];

        return decimalToBinary(smallBlockTable[rowIndex][columnIndex], 4).split('').map(Number);

    } catch (exception) {
        console.log(exception);
        process.exit();
    }
}

function encodeBlock(block, key) {
    try {
        if (block.length !== BLOCK_SIZE) {
            throw new Error(`Block length should be equal to ${BLOCK_SIZE}`);
        }

        console.log(`From the original 64-bit key: `);
        console.log(key);

        const keyPlus = permutation(key, initialKeyPermutaion);

        console.log(`We get the 56-bit permutation: `);
        console.log(keyPlus);

        let C = [], D = [];

        console.log(`Next, split this key into left and right halves, C0 and D0, where each half has 28 bits.`);

        const [C0, D0] = divideBlockIntoTwoParts(keyPlus);
        
        console.log(`C_0: `);
        console.log(C0);
        C[0] = C0;

        console.log(`D_0: `)
        console.log(D0);
        D[0] = D0;

        console.log(`With C0 and D0 defined, we now create sixteen blocks C_i and D_i, 1 <= i <= 16`);

        for (let i = 1; i <= 16; i++) {
            C[i] = cyclicShift(C[i - 1], shiftsTable[i]);
            D[i] = cyclicShift(D[i - 1], shiftsTable[i]);
        }

        console.log("C: ");
        console.log(C);

        console.log("D: ");
        console.log(D);

        console.log('We now form the keys K_i for 1 <= i <= 16');

        let K = [];
        for (let i = 1; i <= 16; i++) {
            K[i] = permutation(joinBlocks(C[i], D[i]), subKeyPermutation);
            console.log(`K_${i}`);
            console.log(K[i]);
        }

        console.log('Applying the initial permutation to the block M, we get IP: ');

        const IP = permutation(block, initialMessagePermutation);

        console.log('M: ');
        console.log(block);

        console.log('IP: ');
        console.log(IP);

        let L = [], R = [];

        const [L0, R0] = divideBlockIntoTwoParts(IP);

        console.log(`From IP we get L_0 and R_0`);

        console.log('L0: ');
        console.log(L0);
        L[0] = L0;

        console.log('R0: ');
        console.log(R0);
        R[0] = R0;

        console.log(`For 1 <= i <= 16 we calculate L_i and R_i`);

        for (let i = 1; i <= 16; i++) {
            L[i] = R[i - 1];
            R[i] = XOR(L[i - 1], f(R[i - 1], K[i]));
        }

        console.log('L: ');
        console.log(L);

        console.log('R: ');
        console.log(R);

        console.log(`
            We have blocks L_16 and R_16. We reverse order of this 
            two blocks into the 64-bit block R16L16 and apply a final 
            permutation and get final result.
        `);

        const R16L16 = joinBlocks(R[16], L[16]);
        console.log('R16L16: ');
        console.log(R16L16);

        const encodedMessage = permutation(
            joinBlocks(R[16], L[16]),
            finalMessagePermutation
        );

        console.log('Finally, we have encoded message: ');
        console.log(encodedMessage);

        return encodedMessage;

    } catch (exception) {
        console.log(exception);
        process.exit();
    }
}

function convertHexToBlock(hex) {
    return hex.split('').map(symbol => {
        const decimal = parseInt(symbol, 16);
        return decimalToBinary(decimal, 4);
    }).join('').split('').map(Number);
}

function convertPlaintextToBlock(plaintext) {
    let binary = '';
    plaintext.split('').forEach(symbol => binary += symbolToBinary(symbol, 8));
    return binary.split('').map(Number);
}

function convertBlockToHex(block) {
    return splitBigBlockIntoSmallBlocks(block, 4).map(block => {
        const decimal = parseInt(block.join(''), 2);
        return decimal.toString(16);
    }).join('');
}

function convertBlockToPlaintext(block) {
    return splitBigBlockIntoSmallBlocks(block, 8)
        .map(block => block.join(''))
        .map(string => parseInt(string, 2))
        .map(code => String.fromCodePoint(code))
        .join('');
}

function encodeHex(message, key) {
    try {
        if (
            message.length % HEX_LENGTH_MULTIPLICITY !== 0 || 
            key.length % HEX_LENGTH_MULTIPLICITY !== 0
        ) {
            throw new Error(`The length of the hex must be a multiple of ${HEX_LENGTH_MULTIPLICITY}`);
        }

        const messageBlock = convertHexToBlock(message);

        const keyBlock = convertHexToBlock(key);

        const messageBlocks = splitBigBlockIntoSmallBlocks(messageBlock, BLOCK_SIZE);

        const encodedMessageBlocks = messageBlocks.map(messageBlock => encodeBlock(messageBlock, keyBlock));

        return encodedMessageBlocks.map(encodedBlock => convertBlockToHex(encodedBlock)).join('');

    } catch (exception) {
        console.log(exception);
        process.exit();
    }
}

function encodePlaintext(message, key) {
    try {
        if (
            message.length % PLAINTEXT_LENGTH_MULTIPLICITY !== 0 || 
            key.length % PLAINTEXT_LENGTH_MULTIPLICITY !== 0
        ) {
            throw new Error(`The length of the plaintext must be a multiple of ${PLAINTEXT_LENGTH_MULTIPLICITY}`);
        }

        const messageBlock = convertPlaintextToBlock(message);

        const keyBlock = convertPlaintextToBlock(key);

        const messageBlocks = splitBigBlockIntoSmallBlocks(messageBlock, BLOCK_SIZE);

        const encodedMessageBlocks = messageBlocks.map(messageBlock => encodeBlock(messageBlock, keyBlock));

        return encodedMessageBlocks.map(encodedBlock => convertBlockToPlaintext(encodedBlock)).join('');

    } catch (exception) {
        console.log(exception);
        process.exit();
    }
}

function f(R, K) {
    const expansioned_R = permutation(R, messageExpansion);

    const XOR_result = XOR(expansioned_R, K);

    const smallBlocks = splitBigBlockIntoSmallBlocks(XOR_result, 6);

    let joinedSmallBlocksAfterProcessing = [];

    smallBlocks.forEach((smallBlock, index) => {
        joinedSmallBlocksAfterProcessing = joinBlocks(
            joinedSmallBlocksAfterProcessing,
            smallBlockProcessing(smallBlock, index)
        );
    });

    return permutation(
        joinedSmallBlocksAfterProcessing,
        rightSubMessagePermutation
    );
}

module.exports = {
    encodeHex,
    encodePlaintext
};