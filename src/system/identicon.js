import sha1 from "crypto-js";



export const draw = (ctx, w, h, username) => {
  let hash = sha1(username);
  let blockWidth = w / 8;

  // Convert the hash, which is represented by 32-bit integers,
  // to a array of 0's and 1's.
  let arr = [];
  for (let word of hash.words) {
    for (let i = 0; i < 32; i++) {
      arr.push((word >> i) & 1);
    }
  }

  let r = 0,
    g = 0,
    b = 0;
  for (let i = 0; i < 8; i++) {
    r += arr[16 + i] << i;
    g += arr[24 + i] << i;
    b += arr[32 + i] << i;
  }

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (arr[i * 4 + j] === 1) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(blockWidth * j, blockWidth * i, blockWidth, blockWidth);
        ctx.fillRect(
          w - blockWidth * (j + 1),
          blockWidth * i,
          blockWidth,
          blockWidth
        ); // Horizontal flip
        ctx.fillRect(
          blockWidth * j,
          h - blockWidth * (i + 1),
          blockWidth,
          blockWidth
        ); // Vertical flip
        ctx.fillRect(
          w - blockWidth * (j + 1),
          h - blockWidth * (i + 1),
          blockWidth,
          blockWidth
        ); // Diagonal flip
      }
    }
  }
};
