#!/usr/bin/env node
var program = require('commander');
const dotenv = require('dotenv')

const scraper = require('./scraper');


const loadEnv = () => {
    dotenv.config();
    return {
        pac: process.env.PAC,
        password: process.env.PASSWORD,
        customerNo: process.env.CUSTOMER_NO,
        printFolder: './prints'
    }
}

program 
    .version('0.1.0')
    .option('-s, --screenshots', 'Screenshot transactions')
    .option('-t, --transactions', 'Save transactions to a json file')
    .option('-b, --balance', 'Account balances')
    .option('-d, --debug', 'Show browser for debugging')
    .parse(process.argv);

if(program.balance || program.screenshots || program.transactions) {
    scraper({ ...loadEnv(), ...program });
}