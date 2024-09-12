class CanvasDownload {
  constructor(images, { title, subTitle, message, source, canvasWidth, canvasHeight, yTextSource } = {}) {
    this.images = images;
    this.title = title;
    this.subTitle = subTitle;
    this.source = source;
    this.message = message;

    this.canvasWidth = canvasWidth ?? 1400;
    this.canvasHeight = canvasHeight ?? 720;
    this.yTextSource = yTextSource ?? 694;
  }

  async setCanvas() {
    const self = this;
    const canvas = document.createElement("canvas");
    canvas.id = "canvas-generator";
    canvas.width = self.canvasWidth;
    canvas.height = self.canvasHeight;
    canvas.style.backgroundColor = "white";
    self.canvas = canvas;
    self.ctx = canvas.getContext("2d");

    // Set canvas color
    self.ctx.fillStyle = "white";
    self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);

    const promises = [];
    self.images.forEach(img => {
      promises.push(self.addImage(img.image, img.height, img.width, img.posX, img.posY));
    });

    await Promise.all(promises);

    self.addText(self.title, self.subTitle);
  }

  reduceProportion(height, width, factor) {
    const nHeight = height * factor;
    const nWidth = width * factor;

    return { nHeight, nWidth };
  }

  addImage(image, height, width, posX, posY) {
    const self = this;
    const canvas = this.canvas;
    const ctx = this.ctx;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function() {
        const x = posX ? posX : canvas.width / 2 - img.width / 2;
        const y = posY ? posY : canvas.height / 2 - img.height / 2;
        // Assuming 'ctx' is a 2D rendering context of the canvas
        console.log(img, x, y, img.width, img.height)
        ctx.drawImage(img, x, y, img.width, img.height);
        resolve();
      };
      img.onerror = (e) => reject(new Error('Image load failed'));

      img.src = image;
      let factor = 1;
      let result = self.reduceProportion(img.naturalHeight, img.naturalWidth, factor)
      while (result.nWidth > self.canvasWidth) {
        factor -= 0.01;
        result = self.reduceProportion(img.naturalHeight, img.naturalWidth, factor)
      }
      img.height = height ?? result.nHeight;
      img.width = width ?? result.nWidth;
    });
  }

  drawTextWithLineBreaks(text, x, y, maxWidth = 1390, lineHeight = 30) {
    const self = this;
    let lineBreakedTimes = 0;
    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line + word + ' ';
      const { width } = self.ctx.measureText(testLine);

      if (width > maxWidth) {
        self.ctx.fillText(line, x, y);
        line = word + ' ';
        y += lineHeight;
        lineBreakedTimes++;
      } else {
        line = testLine;
      }
    }

    self.ctx.fillText(line, x, y);

    return lineBreakedTimes;
  }

  addText() {
    const self = this;

    if (!self.title) {
      return;
    }

    self.ctx.font = "bold 25px Arial";
    self.ctx.fillStyle = "#222";
    let xText = 10;
    let yText = 30;
    const lineBreakedTimes = self.drawTextWithLineBreaks(self.title, xText, yText);

    if (self.subTitle) {
      self.ctx.font = "17px Arial";
      self.ctx.fillStyle = "#222";
      yText = lineBreakedTimes ? (lineBreakedTimes + 1) * 45 : 55;
      xText = 12;
      self.drawTextWithLineBreaks(self.subTitle, xText, yText);
    }

    if (self.source) {
      self.ctx.font = "12px Arial";
      self.ctx.fillStyle = "#222";
      yText = self.yTextSource;
      xText = 230;
      self.drawTextWithLineBreaks(self.source, xText, yText);
    }

    if (self.message) {
      self.ctx.font = "700 70px Arial";
      self.ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
      yText = 560;
      xText = -130;
      self.ctx.rotate(-20 * Math.PI / 180)
      self.drawTextWithLineBreaks(self.message, xText, yText);
    }
  }

  async download() {
    const self = this;
    await self.setCanvas();
    const link = document.createElement("a");
    link.href = self.canvas.toDataURL('image/png');
    link.download = "image";
    link.click();
  }
}

export default CanvasDownload;

