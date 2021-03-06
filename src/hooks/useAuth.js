import { useCallback } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { useToast } from '../state/hooks'
import { connectorsByName } from '../utils/web3React'
import { setupNetwork } from '../utils/wallet'

const useAuth = () => {
  const { activate, deactivate } = useWeb3React()
  const { toastError } = useToast()
  const login = useCallback((connectorID) => {
    const connector = connectorsByName[connectorID]

    if (connector) {
      activate(connector, async (error) => {
        if (error instanceof UnsupportedChainIdError) {
          // const hasSetup = await setupNetwork()
          // console.log(hasSetup)
          // if (hasSetup) {
            activate(connector)

          // } return true;
        } else {
          connector.walletConnectProvider = undefined;
          //  toastError(error.name, error.message)
          return false;
        }
      })
      // return true;
    } else {
      return false;
      toastError("Can't find connector", 'The connector config is wrong')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { login, logout: deactivate }
}

export default useAuth
