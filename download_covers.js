import fs from 'fs';
import https from 'https';
import path from 'path';

const urls = [
    'https://i.imgur.com/CBPc1VD.png',
    'https://i.imgur.com/UbOHSF8.png',
    'https://i.imgur.com/cnC4xzg.png',
    'https://i.imgur.com/wgWjAYt.png',
    'https://i.imgur.com/oJ0eBH2.png',
    'https://i.imgur.com/2vpaRuR.png',
    'https://i.imgur.com/YboGXdV.png',
    'https://i.imgur.com/Kufr6rN.png'
];

const dir = 'public/covers';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

urls.forEach((url, index) => {
    const file = fs.createWriteStream(path.join(dir, `cover${index + 1}.png`));
    https.get(url, function (response) {
        response.pipe(file);
        console.log(`Downloaded cover${index + 1}.png`);
    });
});
