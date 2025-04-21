const express = require('express');
const puppeteer = require('puppeteer');
const port = 5000;
const app = express();

app.get('/extract-links', async (req, res) => {
    const {url, sources_id} = req.query;

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            timeout: 0,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        await page.goto(url);
        await new Promise(resolve => setTimeout(resolve, 5000));

        const data = await page.evaluate(() => `<html>${document.documentElement.innerHTML}</html>`);
	await page.close();
        await browser.close();
        res.send(data);

    } catch (err) {
        res.status(500).send('Error occurred while processing the request.');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
