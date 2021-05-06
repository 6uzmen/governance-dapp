import { Asset } from '../../../types/assets';
import { CachedAssetRate } from '../../containers/BlockChainProvider/types';
import { getTokenContract } from '../../containers/BlockChainProvider/contract-helpers';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { network } from '../../containers/BlockChainProvider/network';
import { AssetsDictionary } from '../../containers/BlockChainProvider/dictionary/assets-dictionary';
import { actions } from '../../containers/BlockChainProvider/slice';
import { toWei } from '../../../utils/helpers';
import { selectBlockChainProvider } from '../../containers/BlockChainProvider/selectors';
import { bignumber } from 'mathjs';

export function usePriceFeeds_tradingPairRates() {
  const { syncBlockNumber, assetRates } = useSelector(selectBlockChainProvider);
  const dispatch = useDispatch();

  const getRate = useCallback(async (sourceAsset: Asset, destAsset: Asset) => {
    return await network.call('priceFeed', 'queryRate', [
      getTokenContract(sourceAsset).address,
      getTokenContract(destAsset).address,
    ]);
  }, []);

  const getSwapRate = useCallback(
    async (sourceAsset: Asset, destAsset: Asset, amount: string = '1') => {
      const path = await network.call('swapNetwork', 'conversionPath', [
        getTokenContract(sourceAsset).address,
        getTokenContract(destAsset).address,
      ]);
      return await network.call('swapNetwork', 'rateByPath', [path, amount]);
    },
    [],
  );

  const getRates = useCallback(async () => {
    const assets = AssetsDictionary.list().map(item => item.asset);
    const items: CachedAssetRate[] = [];
    for (let i = 0; i < assets.length; i++) {
      const source = assets[i];
      for (let l = 0; l < assets.length; l++) {
        const target = assets[l];
        if (
          target === source ||
          target === Asset.CSOV || // todo: remove when oracle will have price
          source === Asset.CSOV ||
          target === Asset.SOV ||
          source === Asset.SOV
        ) {
          continue;
        }
        try {
          const result = await getRate(source, target);
          items.push({
            source,
            target,
            value: result as any,
          });
        } catch (e) {
          console.error(`Failed to retrieve rate of ${source} - ${target}`, e);
        }
      }
    }

    try {
      const btcToSov = await getSwapRate(Asset.RBTC, Asset.SOV, '1');

      items.push({
        source: Asset.RBTC,
        target: Asset.SOV,
        value: {
          precision: '1000000000000000000',
          rate: toWei(btcToSov),
        },
      });

      items.push({
        source: Asset.SOV,
        target: Asset.RBTC,
        value: {
          precision: '1000000000000000000',
          rate: toWei(1 / Number(btcToSov)),
        },
      });

      const btcToUsd = items.find(
        item => item.source === Asset.RBTC && item.target === Asset.USDT,
      )?.value?.rate;

      const sovToUsd = bignumber(btcToUsd)
        .mul(1 / Number(btcToSov))
        .toFixed(0);

      items.push({
        source: Asset.SOV,
        target: Asset.USDT,
        value: {
          precision: '1000000000000000000',
          rate: sovToUsd,
        },
      });

      items.push({
        source: Asset.CSOV,
        target: Asset.USDT,
        value: {
          precision: '1000000000000000000',
          rate: sovToUsd,
        },
      });
    } catch (e) {
      console.error(e);
    }
    return items;
  }, [getRate, getSwapRate]);

  useEffect(() => {
    getRates()
      .then(e => dispatch(actions.setPrices(JSON.parse(JSON.stringify(e)))))
      .catch(console.error);
  }, [dispatch, getRates, syncBlockNumber]);

  return assetRates;
}
