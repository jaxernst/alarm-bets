export function getRandomDays(): number[] {
  // Define possible days
  const daysOfWeek: number[] = [1, 2, 3, 4, 5, 6, 7];

  // Randomly determine the length (between 1 and 7)
  const length: number = Math.floor(Math.random() * 7) + 1;

  // Shuffle and slice the array
  const shuffledDays = shuffleArray(daysOfWeek).slice(0, length);

  // Return the sorted array
  return shuffledDays.sort((a, b) => a - b);
}

// Fisher-Yates (aka Knuth) Shuffle
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]
      ];
  }

  return array;
}