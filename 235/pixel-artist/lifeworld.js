const lifeworld = {
    init(numCols, numRows) {
        this.numCols = numCols;
        this.numRows = numRows;
        this.world = this.buildArray();
        this.randomSetup();
    },

    buildArray() {
        let outerArray = [];
        for (let row = 0; row < this.numRows; row++) {
            let innerArray = [];
            for (let col = 0; col < this.numCols; col++) {
                innerArray.push(0);
            }
            outerArray.push(innerArray);
        }
        return outerArray;
    },

    randomSetup() {
        for (let row = 0; row < this.numRows; row++) {
            for (let col = 0; col < this.numCols; col++) {
                this.world[row][col] = 0;
                if (Math.random() < .1) {
                    this.world[row][col] = 1;
                }
            }
        }
    },

    getLivingNeighbors(row, col) {
        let count = 0;
        for (let y = -1; y <= 1; y++) {

            if (row + y < 0 || row + y > this.numRows - 1) continue;

            for (let x = -1; x <= 1; x++) {

                if (col + x < 0 || col + x > this.numCols - 1) continue;

                if (y == 0 && x == 0) continue;

                count += this.world[row + y][col + x];
            }
        }
        return count;
    },

    step() {
        let nextWorld = this.buildArray();
        for (let row = 0; row < this.numRows; row++) {
            for (let col = 0; col < this.numCols; col++) {
                let neighbors = this.getLivingNeighbors(row, col);

                // Game of Life Rules
                if (this.world[row][col] > 0) {
                    // Underpopulation
                    if (neighbors < 2) {
                        nextWorld[row][col] = 0;
                    // Overpopulation
                    } else if (neighbors > 3) {
                        nextWorld[row][col] = 0;
                    // Stablity
                    } else {
                        nextWorld[row][col] = 1;
                    }
                }
                else {
                    // Reproduction
                    if (neighbors == 3) {
                        nextWorld[row][col] = 1;
                    }
                }
            }
        }
        this.world = nextWorld;
    }
}