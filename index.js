const express = require('express');
const puppeteer = require('puppeteer');
const port = 5000;
const app = express();

app.get('/extract-links', async (req, res) => {

    try {
        let {url, sources_id} = req.query;

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            timeout: 0,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        if (sources_id === '628') {
            url = "https://vps.comodoro.gov.ar/boletinv2/boletines";
            await page.goto(url, {waitUntil: 'networkidle0'});

            // Esperar que el body esté cargado
            await page.waitForSelector('body');

            // Evaluar posición y hacer click en coordenadas exactas
            const clickResult = await page.evaluate(() => {
                const regex = /\d{3}\/\d{4}/; //searches for the pattern 123/1234

                function getFirstTextNodeMatchingRegex(root) {
                    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
                    while (walker.nextNode()) {
                        const textNode = walker.currentNode;
                        if (regex.test(textNode.textContent)) {
                            return textNode;
                        }
                    }
                    return null;
                }

                const textNode = getFirstTextNodeMatchingRegex(document.body);
                if (!textNode) return null;

                const range = document.createRange();
                const match = textNode.textContent.match(regex);
                if (!match) return null;

                const startIndex = textNode.textContent.indexOf(match[0]);
                range.setStart(textNode, startIndex);
                range.setEnd(textNode, startIndex + match[0].length);

                const rect = range.getBoundingClientRect();

                return {
                    x: rect.left + window.scrollX,
                    y: rect.top + window.scrollY,
                    width: rect.width,
                    height: rect.height
                };
            });

            if (clickResult) {
                await page.mouse.click(clickResult.x + clickResult.width / 2, clickResult.y + clickResult.height / 2);
                console.log('Click hecho en la posición del texto que matchea');
            } else {
                console.log('No se encontró texto que matchee');
            }
        } else {
            await page.goto(url);
        }

        await new Promise(resolve => setTimeout(resolve, 10000));

        const data = await page.evaluate(() => `<html>${document.documentElement.innerHTML}</html>`);
        await page.close();
        await browser.close();

        res.send(data);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error occurred while processing the request.');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
