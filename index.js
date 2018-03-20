require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

const pass = process.env.PAC;
const word = process.env.PASSWORD;
const customerNo = process.env.CUSTOMER_NO;
const printFolder = './prints'

const login = async(page) => {
    await page.focus('#iCustId');
    await page.keyboard.type(customerNo);

    const chars = await page.evaluate(() => {
        const sel = Array.from(document.querySelectorAll('.tran_confirm'));
        return sel.map(s => s.innerText);
    });
    
    await page.focus('#ipos1');
    await page.keyboard.type(pass[chars[0]-1]);

    await page.focus('#ipos2');
    await page.keyboard.type(pass[chars[1]-1]);

    await page.focus('#ipos3');
    await page.keyboard.type(pass[chars[2]-1]);

    const submit = await page.$('.iLogon_button_spec');
    submit.click();

    await page.waitForNavigation();

    const chars2 = await page.evaluate(() => {
        const sel = Array.from(document.querySelectorAll('.tran_confirm'));
        return sel.map(s => s.innerText);
    });
   
    await page.focus('#iPasspos1');
    await page.keyboard.type(word[chars2[0]-1]);

    await page.focus('#iPasspos2');
    await page.keyboard.type(word[chars2[1]-1]);

    await page.focus('#iPasspos3');
    await page.keyboard.type(word[chars2[2]-1]);

    const login = await page.$('.iLogon_button_spec2');
    login.click();
    
    await page.waitForNavigation();

    const dismissMessage = await page.$('#continue_butt');
    dismissMessage.click();

    await page.waitForNavigation();
} 

const showCurrentBalance = async(page) => {

    const acno = await page.$eval('.row0 > td > input', el => el.value);
    const acName = await page.$eval('.row0 > td + td + td', el => el.innerText);
    const balance = await page.$eval('.row0 > td + td + td + td', el => el.innerText);
    
    console.log(acno, acName, balance)
}

const selectFirstAccount = async(page) => {
    const account = await page.$('.row0 > td > input');
    account.click();

    await page.waitForNavigation(); 
}

const printTransactions = async(page) => {
    await selectFirstAccount(page);
    await printCurrentPage(page, 1);
}

const goToNextPage = async(page) => {
    const nextLink = await page.$('#Next');

    if(nextLink) {
        nextLink.click();
        await page.waitForNavigation();
        return true;
    }
    return false;
}

const printCurrentPage = async(page, pageNo) => {
    await page.screenshot({path: `${printFolder}/transactions_${pageNo}.png`, fullPage: true });


    if(await goToNextPage(page)) {
        await printCurrentPage(page, pageNo+1);    
    }
}

const getTransactions = async(page, trans) => {
    const transactions = await page.$$eval('table.data_right_content > tbody > tr', rows => rows.map(r => 
        [...r.querySelectorAll('td')].map(td => td.innerText)
    ));
    trans.push(transactions);
    if(await goToNextPage(page)) {
        await getTransactions(page, trans);
    }
};

const saveTransactions = async(page) => {
    await selectFirstAccount(page);
    const transactions = [];
    await getTransactions(page, transactions);

    const json = JSON.stringify({ transactions: transactions })
    fs.writeFileSync(
        'transactions-'+new Date().toUTCString().split(' ').join('-').replace(',', '')+'.json', 
        json, 
        'utf8');
}

(async() => {
    const browser = await puppeteer.launch({headless:false});
    console.log(await browser.version());

    const page = await browser.newPage();
    await page.goto('https://www.caterallenonline.co.uk/WebAccess.dll', {waitUntil: 'networkidle2'});
    
    await login(page);
    await showCurrentBalance(page);

    await printTransactions(page);
    await saveTransactions(page);

    
    browser.close();
  })();