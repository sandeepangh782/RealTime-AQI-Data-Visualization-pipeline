# Crypto API Configuration & Rate Limits

## Current Setup: CoinGecko Free Tier

### Rate Limits
- **Free tier**: ~10-30 calls per minute
- **Current interval**: 30 seconds (2 calls/minute)
- **Status**: ✅ Well within limits

### Features
- ✅ No API key required
- ✅ Real-time price data
- ✅ 24h change percentage
- ✅ Volume & market cap
- ✅ Covers top 10 cryptocurrencies

### Error Handling
The producer now includes:
1. **Retry logic**: Up to 3 attempts with exponential backoff
2. **Rate limit detection**: Automatically waits if 429 error occurs
3. **Graceful degradation**: Skips batch on persistent errors

---

## Alternative APIs (if you need faster updates)

### 1. CoinGecko Pro (Paid)
- **Rate limit**: 500 calls/minute
- **Cost**: ~$129/month
- **URL**: https://www.coingecko.com/en/api/pricing
- **Change needed**: Add API key to headers

### 2. CoinCap API (Free)
- **Rate limit**: 200 requests/minute
- **Free tier**: Yes, no auth needed
- **URL**: https://docs.coincap.io/
- **Change needed**: Update API endpoint and response parsing

### 3. Binance Public API (Free)
- **Rate limit**: 1200 requests/minute
- **Free tier**: Yes, no auth for market data
- **URL**: https://binance-docs.github.io/apidocs/spot/en/
- **Change needed**: Update API endpoint and response parsing

### 4. CryptoCompare (Free/Paid)
- **Rate limit**: 
  - Free: 100,000 calls/month
  - Paid: Higher limits
- **URL**: https://min-api.cryptocompare.com/
- **Change needed**: Requires API key (free)

---

## How to Switch APIs

If you want to use a different API, update `backend/kafka_producer/producer.py`:

1. Change the `COINGECKO_API` constant
2. Update the `fetch_crypto_data()` function to match new response format
3. Adjust the `time.sleep()` interval based on new rate limits

---

## Recommended Settings

| Update Frequency | CoinGecko Free | CoinGecko Pro | Binance |
|-----------------|----------------|---------------|---------|
| 30 seconds      | ✅ Safe        | ✅ Safe       | ✅ Safe |
| 10 seconds      | ⚠️ May hit limit | ✅ Safe     | ✅ Safe |
| 5 seconds       | ❌ Will fail   | ✅ Safe       | ✅ Safe |

**Current**: 30 seconds - optimal for free tier

---

## Monitoring Rate Limits

Watch the producer logs for:
- `✓ BTC ...` = Successful fetch
- `⚠️ Rate limited!` = Hit limit, automatically waiting
- `⏭️ Skipping batch` = Failed after retries

If you see frequent rate limit warnings, increase the interval in `producer.py`.

