import Web3 from 'web3'
import getRpcUrl from './getRpcUrl'

// const RPC_URL = getRpcUrl()
const RPC_URL = "http://localhost:7545";

const getWeb3NoAccount = () => {
  let web3;
  if (window.ethereum) web3 = new Web3(window.ethereum);
  else {
    const httpProvider = new Web3.providers.HttpProvider(RPC_URL, { timeout: 10000 })
    web3 = new Web3(httpProvider)
  }

  return web3;
}

export default getWeb3NoAccount;