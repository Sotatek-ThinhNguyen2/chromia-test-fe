declare global {
  interface Window {
    ethereum: any;
  }
}

import { IClient, createClient,gtv, formatter, encryption } from "postchain-client";
import "./App.css";
import {
  AuthFlag,
  Session,
  createKeyStoreInteractor,
  createSingleSigAuthDescriptorRegistration,
  createWeb3ProviderEvmKeyStore,
  registerAccount,
  registrationStrategy,
  createAmount,
  createInMemoryFtKeyStore,
  BufferId,
  
} from "@chromia/ft4";
import { useEffect, useState } from "react";
import { BridgeClient, bridgeClient } from "@chromia/bridge-client/";
import { getEventMerkleProofQueryObject } from "@chromia/bridge-client/types/stubs/hbridge/hbridge";
import { generateEventWithProof } from "@chromia/bridge-client/util/crypto";
import { Buffer } from "buffer";
import { BrowserProvider, BytesLike } from "ethers";

function App() {
  const [bridgeToChromiaInputValue, setBridgeToChromiaInputValue] =
    useState<number>(0);
  const [bridgeToEvmInputValue, setBridgeToEvmInputValue] = useState<number>(0);
  const [pcl, setPcl] = useState<IClient | undefined>(undefined);
  const [bcl, setBcl] = useState<BridgeClient | undefined>(undefined);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [authDescriptorCount, setAuthDescriptorCount] = useState<number>(0);
  const [assetId, setAssetId] = useState<string>("");
  const [txRid, setTxRid] = useState<Buffer | undefined>(undefined);
  const [eventProofLeaf, setEventProofLeaf] = useState<BytesLike | undefined>(
    undefined,
  );

  const handleBridgeToChromiaInputValue = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setBridgeToChromiaInputValue(parseInt(e.target.value));
  };

  const handleBridgeToEvmInputValue = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setBridgeToEvmInputValue(parseInt(e.target.value));
  };

  useEffect(() => {
    // in case page is refreshed and user needs to login again
    const init = async () => {
      const keyStore = await createWeb3ProviderEvmKeyStore(window.ethereum);
      console.log("🚀 ~ init ~ keyStore:", keyStore)
      const recipientId = gtv.gtvHash(keyStore.id);
      console.log("🚀 ~ init ~ recipientId:", recipientId)
      console.log("🚀 ~ init ~ recipientId buffer:", bufferToHex(recipientId))
      const settings = (import.meta.env.VITE_CHR_NODE === 'true') ? {
        
        nodeUrlPool: import.meta.env.VITE_API_URL,
        blockchainRid: import.meta.env.VITE_BRID,
      } : {
        directoryNodeUrlPool: import.meta.env.VITE_API_URL,
        blockchainRid: import.meta.env.VITE_BRID,
      };
      const pcl = await createClient(settings);

      const a = await pcl.query({name : 'ft4.get_assets_by_name', args : {
        name : 'BUSDT',
        page_size : 1,
        page_cursor: null
      }} );

      console.log(a)
      setPcl(pcl);
      const evmKeyStore = await createWeb3ProviderEvmKeyStore(window.ethereum);
      console.log("🚀 ~ init ~ evmKeyStore:", evmKeyStore, Buffer.from(evmKeyStore.address).toString('hex'))
      const evmKeyStoreInteractor = createKeyStoreInteractor(pcl, evmKeyStore);
      console.log("🚀 ~ init ~ evmKeyStoreInteractor:", evmKeyStoreInteractor)
      const accounts = await evmKeyStoreInteractor.getAccounts();
      console.log("🚀 ~ init ~ accounts:", accounts)
      if (accounts.length === 0) {
        console.log(
          "No accounts found, bridge client will be set up when account is created.",
        );
        return;
      }
      const session = await evmKeyStoreInteractor.getSession(accounts[0].id);
      const provider = new BrowserProvider(window.ethereum);
      const bcl = await bridgeClient(
        {
          bridgeAddress: import.meta.env.VITE_BRIDGE_ADDRESS,
          tokenAddress: import.meta.env.VITE_TOKEN_ADDRESS,
        },
        provider,
        session
      );


      setBcl(bcl);
      console.log(setBcl(bcl))
    };
    init();
  }, []);
  function bufferToHex(buffer: Buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
//   function decodeUint8Array(byteArray: Uint8Array): string {
//     const decoder = new TextDecoder('utf-8'); // Defaults to 'utf-8' encoding
//     return decoder.decode(byteArray);
// }

// function uint8ArrayToHex(byteArray: Uint8Array): string {
//   return Array.from(byteArray)
//       .map(b => b.toString(16).padStart(2, '0')) // Convert each byte to hex and pad with zeros if needed
//       .join(''); // Join them into a single string
// }


  const setup = async () => {
    console.log('a')
    console.log(bcl)
    if (!pcl) {
      console.log("Postchain client not set up");
      return;
    }
    // if(!bcl) return
    console.log("%c Setting up (account creation) ", "color: #bada55");

    const evmKeyStore = await createWeb3ProviderEvmKeyStore(window.ethereum);
    console.log("🚀 ~ setup ~ evmKeyStore:", evmKeyStore, Buffer.from(evmKeyStore.id).toString('hex'), Buffer.from(evmKeyStore.address).toString('hex'))
    const ad = createSingleSigAuthDescriptorRegistration(
      [AuthFlag.Account, AuthFlag.Transfer],
      evmKeyStore.id,
    );
    console.log("🚀 ~ setup ~ ad:", ad)

    // registrationStrategy.fee(Buffer.from('AAB050E959E50229F85DB8BC5F0CB7395655EDF2213AE7E7C25E583F1A9D607D', 'hex'),{
    //   blockchainRid : Buffer.from('5607927566FF5A1C8D5F70F9DDDC07478CB7E599FDCEBEBC9A650D8A68A78691', 'hex'),
    //   decimals : 6,
    //   iconUrl : 'https://s2.coinmarketcap.com/static/img/coins/64x64/11374.png',
    //   name : 'BUSDT',
    //   supply : 10000000000000000n,
    //   symbol : 'BUSDT',
    //   type : 'ft4',
    //   id : Buffer.from('2BF734F663EEF1B9671AC5A184BEE9F793BF6E39ED94750DD377328E078FAFCD', 'hex')
    // },ad),

    const b = await pcl.query({name : 'ft4.get_assets_by_name', args : {
      name : 'BUSDC',
      page_size : 1,
      page_cursor: null
    }} );
    console.log("🚀 ~ setup ~ b:", b)
    try {
      const response = await registerAccount(
        pcl,
        evmKeyStore,
        registrationStrategy.open(ad)
      );
      console.log(response);
    } catch (e) {
      console.log(e);
    }
    try {
      console.log("%c Setting up (bridge client) ", "color: #bada55");
      const evmKeyStore = await createWeb3ProviderEvmKeyStore(window.ethereum);
      console.log("🚀 ~ setup ~ evmKeyStore:", evmKeyStore)
      const evmKeyStoreInteractor = createKeyStoreInteractor(pcl, evmKeyStore);
      const accounts = await evmKeyStoreInteractor.getAccounts();
      const session = await evmKeyStoreInteractor.getSession(accounts[0].id);
      const provider : any = new BrowserProvider(window.ethereum);
      const bcl = await bridgeClient(
        {
          bridgeAddress: import.meta.env.VITE_BRIDGE_ADDRESS,
          tokenAddress: import.meta.env.VITE_TOKEN_ADDRESS,
        },
        provider,
        session,
      );
      await bcl.linkEvmEoaAccount(evmKeyStore);
      console.log('ha')
      setSession(session);
      setBcl(bcl);
    } catch (e) {
      console.log(e);
    }
  };

  const login = async () => {
    if (!pcl) {
      console.log("Postchain client not set up");
      return;
    }
    const evmKeyStore = await createWeb3ProviderEvmKeyStore(window.ethereum);
    const evmKeyStoreInteractor = createKeyStoreInteractor(pcl, evmKeyStore);
    const accounts = await evmKeyStoreInteractor.getAccounts();
    const session = await evmKeyStoreInteractor.getSession(accounts[0].id);
    console.log("%c Logged in on account (session)", "color: #bada55");
    setSession(session);
  };

  const approve = async () => {
    if (!session) return;
    if (!bcl) return;
    console.log("%c Approving spending of tokens by Bridge ", "color: #bada55");
    try {
      const contractTransactionResponse = await bcl.approveDepositAmount(
          BigInt(bridgeToChromiaInputValue),
      );
      console.log(contractTransactionResponse);
    } catch (e) {
      console.log(e);
    }
  };

  const bridge = async () => {
    // if (!session) return;
    if (!bcl) return;
    console.log("%c Bridging to EVM contract ", "color: #bada55");
    try {
      const contractTransactionResponse = await bcl.depositToEvmBridgeContract(
        BigInt(bridgeToChromiaInputValue),
      );
      console.log(contractTransactionResponse);
    } catch (e) {
      console.log(e);
    }
  };

  const crosschainTransfer = async () => {
    if (!session) return;
    if (!bcl) return;
    if (!pcl) return;
    const keyPair = encryption.makeKeyPair('20a7e02ed369dab409eec336c5f1a0fffac7d098af73d115dbe3016ef5865750')
    console.log("🚀 ~ crosschainTransfer ~ keyPair:", Buffer.from(keyPair.pubKey).toString('hex'))
    const accountId = '3C506D09968AED608C8BC5759B984E821DFC7C48C99C5DE82DE8DF4168354A74';
    const client0 = await createClient({
      nodeUrlPool: "http://localhost:7740",
      blockchainRid: '52E069E4794EA250B70B076188680F9E9284C2A45F3B7A5F683503666F0AF61E'
    });
    console.log("🚀 ~ crosschainTransfer ~ client0:", client0)
    const { getSession } = createKeyStoreInteractor(
      client0,
      createInMemoryFtKeyStore(keyPair)
    );
    console.log("🚀 ~ crosschainTransfer ~ getSession:", {getSession})
    const session0 = await getSession(accountId);
    console.log("🚀 ~ crosschainTransfer ~ session0:", session0, Buffer.from(session0.account.id).toString('hex'))
    console.log("%c Bridging to EVM contract ", "color: #bada55");
    try {
      console.log('a')
      await session0.account.crosschainTransfer(
        Buffer.from('B7947AB9D2C4EB736E78994344FF78FA5F0F7CE5DD675D2BA86885395954284D').toString('hex') as BufferId,
        Buffer.from('ED8AD44F4F5BFF282B51B8C99B31F90B319B087E19EF946D2FC9D1EC463D3876').toString('hex') as BufferId,
        Buffer.from('90F36151228B00FC77F791AC3AFC802DB16024C292F6D0BC9BE34121FF42DF7A').toString('hex') as BufferId,
        createAmount(2,18)
      )
      .on("built", (tx) => console.log("Transaction signed"))
      .on("init", (receipt) => console.log("Transfer initialized"))
      .on("hop", (bcRid) => console.log(`On chain ${formatter.toString(bcRid)}`));
    } catch (e) {
      console.log("e",e);
    }
  };

  const bridgeFromChromia = async () => {
    // if (!session) return;
    if (!bcl) return;

    console.log(bcl)
    console.log("%c Bridging from Chromia to EVM ", "color: #bada55");
    try {
      const response = await bcl.bridgeFromChromia(
        BigInt(bridgeToEvmInputValue),
        Buffer.from('26CCCB33ED4DD0B402CA3CB5B89556AECCA157753922E7B4DD12A1D4A8F76E1D', "hex"),
      );
      console.log("🚀 ~ bridgeFromChromia ~ response:", response)
      const txRid = response.receipt.transactionRid;
      console.log("🚀 ~ bridgeFromChromia ~ txRid:", txRid, new Uint8Array(txRid).toString(), txRid.toString())
      setTxRid(txRid);
    } catch (e) {
      console.log(e);
    }
  };

  const withDrawFromEvm = async () => {
    if (!session) return;
    if (!bcl) return;
    // if (!txRid) return;
    console.log("%c Requesting withdraw from EVM ", "color: #bada55");
    try {
      console.log(txRid);
      // const erc20WithdrawalInfo = await bcl.getErc20WithdrawalByTransactionRid(
      //   txRid,
      //   1,
      // );
      // if (!erc20WithdrawalInfo) {
      //   console.log("No withdrawal info found");
      //   return;
      // }

      if (import.meta.env.VITE_CHR_NODE === 'true') {
        // const eventMerkleProofObj = await session.query(
        //     getEventMerkleProofQueryObject(erc20WithdrawalInfo.event_hash.toString("hex")),
        // );
        const eventMerkleProofObj = await session.query(
          getEventMerkleProofQueryObject(Buffer.from('AD106F3579BE7847C1E889C2DB4239CEB84E65B25D6E4AB038068EA5BA5E0ADD', 'hex').toString('hex')),
      );
        console.log("🚀 ~ withDrawFromEvm ~ eventMerkleProofObj:", eventMerkleProofObj)
        const eventProof = generateEventWithProof(eventMerkleProofObj);
        setEventProofLeaf(eventProof.eventProof.leaf);
        const requestedWithdraw = await bcl.requestEvmWithdraw(eventProof);
        console.log(requestedWithdraw);
      } else {
        // const eventProof = await bcl.getWithdrawRequestEventProof(
        //     erc20WithdrawalInfo.event_hash.toString("hex"),
        // );
        const eventProof = await bcl.getWithdrawRequestEventProof(
          Buffer.from('AD106F3579BE7847C1E889C2DB4239CEB84E65B25D6E4AB038068EA5BA5E0ADD', 'hex').toString('hex'),
      );
        setEventProofLeaf(eventProof.eventProof.leaf);
        const requestedWithdraw = await bcl.requestEvmWithdraw(eventProof);
        console.log(requestedWithdraw);
      }

    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (!session) return;
    const getAuthDescriptors = async () => {
      const authDescriptors = await session.account.getAuthDescriptors();
      // console.log("🚀 ~ getAuthDescriptors ~ authDescriptors:", authDescriptors)
      const allAssets = await session.getAllAssets();
      console.log("🚀 ~ getAuthDescriptors ~ allAssets:", allAssets)

      
      for(const a of allAssets.data) {
      console.log("🚀 ~ getAuthDescriptors ~ a:", a)
      console.log("🚀 ~ getAuthDescriptors ~ a:", a.id.toString('hex'))
      }
      
      // const a = await session.query({name : 'ft4.get_asset_balance', args : {
      //   account_id : session.account.id,
      //   asset_id : allAssets.data[0].id
      // }} )
      // console.log("🚀 ~ getAuthDescriptors ~ a++++++++++++++++++++++++++++++++++++++++++:", a)
      // console.log("🚀 ~ getAuthDescriptors ~ allAssets:", allAssets)
      setAssetId(allAssets.data[0].id.toString("hex"));
      setAuthDescriptorCount(authDescriptors.length);
    };
    getAuthDescriptors();
  }, [session]);

  const deleteAuthDescs = async () => {
    console.log("Deleting auth descriptors (except main)");
    if (!session) return;
    session.account.deleteAllAuthDescriptorsExceptMain();
  };

  const evmWithdraw = async () => {
    if (!session) return;
    if (!bcl) return;
    if (!eventProofLeaf) return;
    try {
      const withdrawal = await bcl.evmWithdraw(Buffer.from('AD106F3579BE7847C1E889C2DB4239CEB84E65B25D6E4AB038068EA5BA5E0ADD','hex') as Buffer);
      console.log("LINE: 203 | withdrawal: ", withdrawal);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <main>
      <div>
        <h1>Bridge Demo</h1>
        <h2>Set up and create account</h2>
        <button onClick={setup}>Setup</button>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p style={{ width: "50%" }}>
            Setup needs to be done the first time you run this application in
            order to create an account on the chain that you have configured in
            postchain-client
          </p>
        </div>
        <h2>Login</h2>
        <button onClick={login}>Login</button>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p style={{ width: "50%" }}>
            If setup has been done before you can simply just log in to the
            account you created in the previous step. Use this button whenever
            you lose the state of the application
          </p>
        </div>
        <h2>Bridge tokens from EVM to Chromia</h2>
        <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
        >
          <input
              onChange={handleBridgeToChromiaInputValue}
              value={bridgeToChromiaInputValue}
              type="number"
          ></input>
          <button onClick={approve}>
            Approve spending of {bridgeToChromiaInputValue} tokens by the Bridge
          </button>
          <button onClick={crosschainTransfer}>
            Approve spending of tokens by the Bridge
          </button>
          <button onClick={bridge}>
            Bridge {bridgeToChromiaInputValue} tokens to Chromia
          </button>
        </div>
        <h2>Bridge tokens from Chromia to EVM</h2>
        <div
            style={{
              display: "flex",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "20%" }}
          >
            <input
              onChange={handleBridgeToEvmInputValue}
              value={bridgeToEvmInputValue}
              type="number"
            ></input>
            <button onClick={bridgeFromChromia}>
              Bridge {bridgeToEvmInputValue} tokens to EVM
            </button>
            <button onClick={withDrawFromEvm}>Request Withdraw from EVM</button>
            <button onClick={evmWithdraw}>Withdraw from bridge</button>
          </div>
        </div>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <h1 style={{ color: "red" }}>Danger zone</h1>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p style={{ width: "50%" }}>
            Note: these should be cleared out each time the page is reloaded,
            but if you find that you are locked out from logging in (at 10 auth
            descriptors), you may delete them manually here.
          </p>
        </div>
        <p>
          <b>Auth descriptors count: {authDescriptorCount}</b>
        </p>
        <button style={{ color: "red" }} onClick={deleteAuthDescs}>
          Delete auth descriptors
        </button>
      </div>
    </main>
  );
}

export default App;
