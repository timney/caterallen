require('dotenv').config();
const puppeteer = require('puppeteer');

const pass = process.env.PAC;
const word = process.env.PASSWORD;

const login = async(page) => {
    await page.focus('#iCustId');
    await page.type(process.env.CUSTOMER_NO);

    const chars = await page.evaluate(() => {
        const sel = Array.from(document.querySelectorAll('.tran_confirm'));
        return sel.map(s => s.innerText);
    });
    console.log(chars)
    await page.focus('#ipos1');
    await page.type(pass[chars[0]-1]);

    await page.focus('#ipos2');
    await page.type(pass[chars[1]-1]);

    await page.focus('#ipos3');
    await page.type(pass[chars[2]-1]);

    const submit = await page.$('.iLogon_button_spec');
    submit.click();

    await page.waitForNavigation();

    const chars2 = await page.evaluate(() => {
        const sel = Array.from(document.querySelectorAll('.tran_confirm'));
        return sel.map(s => s.innerText);
    });
   
    await page.focus('#iPasspos1');
    await page.type(word[chars2[0]-1]);

    await page.focus('#iPasspos2');
    await page.type(word[chars2[1]-1]);

    await page.focus('#iPasspos3');
    await page.type(word[chars2[2]-1]);

    const login = await page.$('.iLogon_button_spec2');
    login.click();
    
    await page.waitForNavigation();

    const dismissMessage = await page.$('#continue_butt');
    dismissMessage.click();

    await page.waitForNavigation();
} 

const readAccounts = async(page) => {

    const acno = await page.$eval('.row0 > td > input', el => el.value);
    const acName = await page.$eval('.row0 > td + td + td', el => el.innerText);
    const balance = await page.$eval('.row0 > td + td + td + td', el => el.innerText);
    
    console.log(acno, acName, balance)
}

(async() => {
    const browser = await puppeteer.launch({headless:false});
    console.log(await browser.version());

    const page = await browser.newPage();
    await page.goto('https://www.caterallenonline.co.uk/WebAccess.dll', {waitUntil: 'networkidle'});
    
    await login(page);
    await readAccounts(page);
    
    browser.close();
  })();