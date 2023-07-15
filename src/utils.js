export const randomHexColor = (stringInput) => {
    let stringUniqueHash = [...stringInput].reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
}

export const textToHex = (text) => {
  const codePoints = text.split("").map(c => c.charCodeAt(0));
  const hexCodes = codePoints.map(c => c.toString(16).padStart(2, "0"));
  return hexCodes.join("");
}

export const timestampToYear = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  return year;
};
