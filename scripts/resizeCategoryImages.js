require('dotenv').config();
const sharp = require('sharp');
const { Category, sequelize } = require('../models');

(async () => {
  const cats = await Category.findAll();
  for (const c of cats) {
    if (!c.imageBase64) continue;
    try {
      const raw = c.imageBase64.replace(/^data:image\/[\w+.-]+;base64,/, '');
      const before = raw.length;
      const out = await sharp(Buffer.from(raw, 'base64'))
        .rotate()
        .resize(320, 320, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      await c.update({ imageBase64: out.toString('base64'), imageMime: 'image/webp' });
      console.log(`${c.name}: ${(before / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB`);
    } catch (e) {
      console.error(`${c.name}: skipped (${e.message})`);
    }
  }
  await sequelize.close();
})();