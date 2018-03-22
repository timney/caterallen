const puppeteer = require('puppeteer');
const fs = require('fs');

const login = async(page, { customerNo, password, pac }) => {
    await page.focus('#iCustId');
    await page.keyboard.type(customerNo);

    const chars = await page.evaluate(() => {
        const sel = Array.from(document.querySelectorAll('.tran_confirm'));
        return sel.map(s => s.innerText);
    });
    
    await page.focus('#ipos1');
    await page.keyboard.type(pac[chars[0]-1]);

    await page.focus('#ipos2');
    await page.keyboard.type(pac[chars[1]-1]);

    await page.focus('#ipos3');
    await page.keyboard.type(pac[chars[2]-1]);

    const submit = await page.$('.iLogon_button_spec');
    submit.click();

    await page.waitForNavigation();

    const chars2 = await page.evaluate(() => {
        const sel = Array.from(document.querySelectorAll('.tran_confirm'));
        return sel.map(s => s.innerText);
    });
   
    await page.focus('#iPasspos1');
    await page.keyboard.type(password[chars2[0]-1]);

    await page.focus('#iPasspos2');
    await page.keyboard.type(password[chars2[1]-1]);

    await page.focus('#iPasspos3');
    await page.keyboard.type(password[chars2[2]-1]);

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

const printTransactions = async(page, folder) => {
    await selectFirstAccount(page);
    await printCurrentPage(page, 1, folder);
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

const printCurrentPage = async(page, pageNo, folder) => {
    await page.screenshot({path: `${folder}/transactions_${pageNo}.png`, fullPage: true });


    if(await goToNextPage(page)) {
        await printCurrentPage(page, pageNo+1, folder);    
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

module.exports = async(config) => {
    const browser = await puppeteer.launch({ headless: !config.debug });

    const page = await browser.newPage();
    await page.goto('https://www.caterallenonline.co.uk/WebAccess.dll', {waitUntil: 'networkidle2'});
    
    await login(page, config);
    if(config.balance) {
        await showCurrentBalance(page);
    }
    if(config.screenshots) {
        await printTransactions(page, config.printFolder);
    }
    if(config.transactions) {
        await saveTransactions(page);
    }
    browser.close();
  };