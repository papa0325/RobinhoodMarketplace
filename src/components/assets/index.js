import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content'
import { NotificationManager } from "react-notifications";
import getWeb3NoAccount from "../../utils/web3";
import InnerNav from '../layout/marketplace-nav';
import Token from "../../ABI/Token.json";
import Robinhood from "../../ABI/Mint.json";
import Marketplace from "../../ABI/Marketplace.json";
import address from "../../config/address.json";
import empty from "../../Assets/empty.png";

import ScreenLoading from "../Loading/screenLoading";
import ItemLoading from "../Loading/itemLoading";

const { marketplace_address, nft_address, token_address } = address;

const MyAssets = () => {
    const [web3, setWeb3] = useState(null);
    const [token, setToken] = useState(null);
    const [robinHood, setNFT] = useState(null);
    const [marketplace, setMarketplace] = useState(null);
    const [assets, setAssets] = useState([]);
    const [account, setAccount] = useState();
    const [isScreen, setScreenLoading] = useState(false);
    const [isItem, setItemLoading] = useState(true);

    useEffect(async () => {
        const _web3 = await getWeb3NoAccount();
        const _robinHood = new _web3.eth.Contract(Robinhood, nft_address);
        const _token = new _web3.eth.Contract(Token, token_address);
        const _marketplace = new _web3.eth.Contract(Marketplace, marketplace_address);
        const _account = await _web3.eth.getAccounts();
        
        setAccount(_account[0]);
        setWeb3(_web3);
        setToken(_token);
        setNFT(_robinHood);
        setMarketplace(_marketplace);

    },[]);

    useEffect(async() => {
        if (!web3 || !robinHood || !marketplace ) return;
        await getPersonalNFT();
    },[web3, robinHood, marketplace, account])

    const putOnSale = async (id) => {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        const priceSwal = withReactContent(Swal);
        await priceSwal.fire({
          title: '<span style="font-size: 22px">PLEASE ENTER PRICE</span>',
          input: 'number',
          width: 350,
          inputAttributes: {
            autocapitalize: 'off',
          },
          inputValidator: (value) => {
            if (value < 0.1)  return "Price must be greater than 0.1.";
          },
          color: '#000',
          showCancelButton: true,
          confirmButtonText: 'OK',
          showLoaderOnConfirm: true,
          allowOutsideClick: () => !Swal.isLoading()
        })
        .then(async(result) => {
          if (result.isConfirmed) {
            setScreenLoading(true);
            try {
                const item = await marketplace.methods.getNFTItem(id).call();
                let photoPrice;
                await robinHood.methods.approve(marketplace_address, id).send({from : account });
                switch(item.marketInfo.currency) {
                    case "0":
                        photoPrice = web3.utils.toWei((result.value).toString(), 'gwei');
                        await token.methods.approve(marketplace_address, photoPrice).send({ from: account });
                        await marketplace.methods.openTradeWithToken(id, photoPrice / 10).send({ from: account }).then( async(res) => {
                            NotificationManager.success("Success");
                            await getPersonalNFT();
                            setScreenLoading(false);
                        })
                        break;
                    case "1":
                        photoPrice = web3.utils.toWei((result.value).toString(), 'ether');
                        await marketplace.methods.openTradeWithBNB(id).send({ from: account, value: photoPrice / 10 }).then( async(res) => {
                            NotificationManager.success("Success");
                            await getPersonalNFT();
                            setScreenLoading(false);
                        })
                        break;
                }
                
            } catch(err) {
                console.log(err);
                NotificationManager.error("Failed");
                setScreenLoading(false);
            }
          }
        })
          
    }

    const cancelOnSale = async (id) => {
        setScreenLoading(true);
        try {
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];
            const photo = await marketplace.methods.getNFTItem(id).call();
            let buyAmount = photo.marketInfo.price;
            switch(photo.marketInfo.currency) {
                case "0":
                    await token.methods.approve(marketplace_address, buyAmount).send({ from: account });
                    await marketplace.methods.closeTradeWithToken(id, buyAmount / 10).send({ from: account }).then( async(res) => {
                        NotificationManager.success("Success");
                        await getPersonalNFT();
                        setScreenLoading(false);
                    })
                    break;
                case "1":
                    await marketplace.methods.closeTradeWithBNB(id).send({ from: account, value: buyAmount / 10 }).then( async(res) => {
                        NotificationManager.success("Success");
                        await getPersonalNFT();
                        setScreenLoading(false);
                    })
                    break;
            }
        } catch(err) {
            setScreenLoading(false);
            NotificationManager.error("Failed");
        }
    }

    const getPersonalNFT = async() => {
        setItemLoading(true);
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        let list = await marketplace.methods.getAllNFTs().call();
        list = list.filter(item => item.baseInfo.owner == account);
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
                                    <InnerNav active="personal"/>
                                    <div className="row" style={{minHeight: '300px'}}>
                                        <div className="col-md-11 m-auto">
                                            <div className="main-outer-content">
                                                <div className="row">
                                                    { isItem && <ItemLoading/>}
                                                    {
                                                        !isItem &&
                                                        assets.map((item, idx) => {
                                                            return (
                                                                <div className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3" key={idx}>
                                                                    <div className="ITEM-CARD">
                                                                        <div className="upper-div-item">
                                                                        {
                                                                                item.ext == "mp4" ?
                                                                                    <video autoPlay muted className="nft-item-fluid" >
                                                                                        <source src={`http://localhost:8080/ipfs/${item.asset}`} type="video/mp4"/>
                                                                                    </video>
                                                                                :(
                                                                                    item.ext == "mp3" ?
                                                                                    <audio controls  className="nft-item-fluid">
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
                                                                                {
                                                                                    !item.marketInfo.marketStatus ?
                                                                                        <button onClick={() => putOnSale(item.baseInfo.tokenID)}>Sell</button>
                                                                                    : <button onClick={() => cancelOnSale(item.baseInfo.tokenID)}>Cancel Sell</button>
                                                                                }
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

export default MyAssets;