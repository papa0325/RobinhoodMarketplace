import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content'
import getWeb3NoAccount from "../../utils/web3";
import InnerNav from '../layout/marketplace-nav';
import Token from "../../ABI/Token.json";
import Robinhood from "../../ABI/Mint.json";
import RobinMarket from "../../ABI/Marketplace.json";
import address from "../../config/address.json";
import './market.scss';
import empty from "../../Assets/empty.png";

import ScreenLoading from "../Loading/screenLoading";
import ItemLoading from "../Loading/itemLoading";
import { NotificationManager } from "react-notifications";
import { add } from "lodash";

const { marketplace_address, nft_address, token_address } = address;

const Marketplace = () => {

    const [web3, setWeb3] = useState(null);
    const [token, setToken] = useState(null);
    const [robinHood, setNFT] = useState(null);
    const [marketplace, setMarketplace] = useState(null);
    const [assets, setAssets] = useState([]);
    const [isScreen, setScreenLoading] = useState(false);
    const [isItem, setItemLoading] = useState(false);

    useEffect(async () => {
        const _web3 = await getWeb3NoAccount();
        const _robinHood = new _web3.eth.Contract(Robinhood, nft_address);
        const _token = new _web3.eth.Contract(Token, token_address);
        const _marketplace = new _web3.eth.Contract(RobinMarket, marketplace_address);

        setWeb3(_web3);
        setToken(_token);
        setNFT(_robinHood);
        setMarketplace(_marketplace);

    },[]);

    const buyNFT = async (id) => {        
        // if (!isMetaMask) {
        //   NotificationManager.warning("Metamask is not connected!", "Warning");
        //   return;
        // }
        const photo = await marketplace.methods.getNFTItem(id).call();
        if (photo.marketInfo.currency == "0") {
            const priceSwal = withReactContent(Swal);
            await priceSwal.fire({
                text: "Which token would like you to buy NFT with?",
                icon: 'info',
                showDenyButton: true,
                confirmButtonColor: '#3085d6',
                denyButtonColor: '#d33',
                denyButtonText: 'BNB',
                confirmButtonText: "Token"
            }).then(async(result) => {
                if (result.isConfirmed) {
                    setScreenLoading(true);
                    try {
                        const buyAmount = photo.marketInfo.price;
                        const accounts = await web3.eth.getAccounts();
                        const account = accounts[0];
                        await token.methods.approve(marketplace_address, buyAmount).send({ from: account });
                        await marketplace.methods.buyNFTWithToken(id, buyAmount).send({ from: account });
                        setScreenLoading(false);
                        NotificationManager.success("Success");
                        await getPersonalNFT();
                        
                    } catch(err) {
                        console.log(err);
                        setScreenLoading(false);
                        NotificationManager.error("Failed");
                    }
                }

                if (result.isDenied) {
                    setScreenLoading(true);
                    try {
                        const price = web3.utils.fromWei(photo.marketInfo.price, "gwei");
                        const accounts = await web3.eth.getAccounts();
                        const account = accounts[0];
                        // const amountsIn = web3.utils.toWei(10 * price, "ether");
                        const addition = web3.utils.toWei("0.1", "ether");
                        // const addition = await marketplace.methods.calculateBNB(amountsIn).call();
                        await marketplace.methods.buyNFTWithBNB(id).send({ from: account, value: addition });
                        setScreenLoading(false);
                        NotificationManager.success("Success");
                        await getPersonalNFT();
                        
                    } catch(err) {
                        console.log(err);
                        setScreenLoading(false);
                        NotificationManager.error("Failed");
                    }
                }
            })
        }
        else {
            setScreenLoading(true);
            try {
                const buyAmount = photo.marketInfo.price;
                const accounts = await web3.eth.getAccounts();
                const account = accounts[0];
                    await marketplace.methods.buyNFTWithBNB(id).send({ from: account, value: buyAmount });
                    setScreenLoading(false);
                    NotificationManager.success("Success");
                    await getPersonalNFT();
                
            } catch(err) {
                console.log(err);
                setScreenLoading(false);
                NotificationManager.error("Failed");
            }
        }
    }
    
    useEffect(async() => {
        if (!web3 || !robinHood || !marketplace) return;
        await getPersonalNFT();
    },[web3, robinHood, marketplace])

    const getPersonalNFT = async() => {
        setItemLoading(true);
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        let list = await marketplace.methods.getAllNFTs().call();
        list = list.filter(item => item.marketInfo.marketStatus &&( item.baseInfo.owner != account || !account));
        let finalList = [];
        await Promise.all(list.map(async (item) => {
            try {
                const response = await fetch(`http://localhost:8080/ipfs/${item.baseInfo.tokenURI}`);
                if(!response.ok)
                    throw new Error(response.statusText);
                const json = await response.json();
                finalList.push({ ...item, ...json });
            } catch(err) {

            }
        }) );

        setAssets(finalList);
        setItemLoading(false);
    }

    return (
        <>
            { isScreen && <ScreenLoading/> }
            <section className="live-auctions ">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-xl-12 col-lg-12 main-image-ss">
                            <div className="image-back-main ">
                                <div className="nav-nmn pt-5">
                                    <InnerNav active="marketplace"/>
                                    <div className="row"style={{minHeight: '300px'}}>
                                        <div className="col-md-11 m-auto">
                                            <div className="main-outer-content">
                                                <div className="row">
                                                    { isItem && <ItemLoading/>}
                                                    
                                                    {
                                                        !isItem &&
                                                        assets.map((item, idx) => {
                                                            return (
                                                                <div className="col-lg-3 col-md-6 col-sm-6 col-12 mb-3" key={idx}>
                                                                    <div className="ITEM-CARD">
                                                                        <div className="upper-div-item">
                                                                            {
                                                                                item.ext == "mp4" ?
                                                                                    <video className="nft-item-fluid" autoPlay muted>
                                                                                        <source src={`http://localhost:8080/ipfs/${item.asset}`} type="video/mp4"/>
                                                                                    </video>
                                                                                :(
                                                                                    item.ext == "mp3" ?
                                                                                    <audio className="nft-item-fluid" controls>
                                                                                        <source src={`http://localhost:8080/ipfs/${item.asset}`} type="audio/mp3" />
                                                                                    </audio>
                                                                                    : <img alt="" src={`http://localhost:8080/ipfs/${item.asset}`} className="nft-item-fluid" />
                                                                                )
                                                                            }
                                                                        </div>


                                                                        <div className="lower-text-ares">

                                                                            <h4>{item.name}</h4>
                                                                            <div className="price">
                                                                                <h6 className="mr-5">Price <span>{
                                                                                    item.marketInfo.currency == "0" ?
                                                                                        web3.utils.fromWei(item.marketInfo.price, 'gwei') + ' XRHP'
                                                                                    : web3.utils.fromWei(item.marketInfo.price, 'ether') + ' BNB'
                                                                                }</span></h6>
                                                                                <h6>1 of {item.copyNumber}</h6>
                                                                            </div>
                                                                            <div className="buttonss">
                                                                                <button onClick={() => buyNFT(item.baseInfo.tokenID)}>Buy</button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    }

                                                    {
                                                        !assets.length && !isItem &&
                                                        <div className="text-center w-100"><img src={empty}/></div>
                                                    }

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Marketplace;
