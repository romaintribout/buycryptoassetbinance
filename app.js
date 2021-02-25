const Binance = require('binance-api-node').default;
const config = require('./config.json');

const { symbol } = config;

const client = Binance({
  apiKey: config.apiKey,
  apiSecret: config.apiSecret,
  getTime: () => Date.now(),
});

const run = async () => {
  const [
    accountInfo,
    prices,
    exchangeInfo,
  ] = await Promise.all([
    client.accountInfo(),
    client.avgPrice({ symbol }),
    client.exchangeInfo(),
  ]);

  const assetInfo = exchangeInfo.symbols.find((elem) => elem.symbol === symbol);

  const stepQty = Math.log10(1 / parseFloat(
    assetInfo.filters.find((elem) => elem.filterType === 'LOT_SIZE').stepSize,
  ));

  const stepPrice = Math.log10(1 / parseFloat(
    assetInfo.filters.find((elem) => elem.filterType === 'PRICE_FILTER').tickSize,
  ));

  const accountEuro = accountInfo.balances.find((elem) => elem.asset === 'EUR');
  const priceAssetEur = parseFloat(prices.price);

  if (accountEuro && parseFloat(accountEuro.free)) {
    const qty = parseFloat(accountEuro.free) / priceAssetEur;
    try {
      await client.order({
        symbol,
        side: 'BUY',
        price: (priceAssetEur).toFixed(stepPrice),
        quantity: qty.toFixed(stepQty),
      });
    } catch (error) {
      console.log(error);
    }
  }
};

run();
