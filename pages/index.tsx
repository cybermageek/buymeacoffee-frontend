import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import { abi as contractAbi } from "../abis/BuyMeACoffee.json";
import { Contract, ethers } from "ethers";

const Home: NextPage = () => {
  const contractAddress = "0x134C96daAeBf0e99fb2ED69bB48E73EaCDc5aE61";

  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState<any[]>([]);

  const nameChanged = (event: any) => {
    setName(event.target.value);
  };

  const messageChanged = (event: any) => {
    setMessage(event.target.value);
  };

  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;
      const accounts = await ethereum?.request<string[]>({
        method: "eth_accounts",
      });
      if (accounts?.length! > 0) {
        console.log("wallet is connected: ", accounts![0]);
      } else {
        console.log("make sure metamask is connected");
      }
    } catch (err) {
      console.error("error:", err);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("please install metamask");
      }
      const accounts = await ethereum!.request<string[]>({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts![0]!);
    } catch (err) {
      console.error("error: ", err);
    }
  };

  const buyCoffee = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(
          ethereum as any,
          "any"
        );
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );
        console.log("Buying coffee..");
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ?? "",
          message ?? "",
          { value: ethers.utils.parseEther("0.01") }
        );
        await coffeeTxn.wait();

        console.log("Mined", coffeeTxn.hash);
        console.log("Coffee purchased!");

        setName("");
        setMessage("");
      }
    } catch (err) {
      console.error("error: ", err);
    }
  };

  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(
          ethereum as any,
          "any"
        );
        const signer = provider.getSigner();
        const buyMeACoffee: Contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );
        console.log("Fetching memos from blockchain!");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("metamask is not connected!");
      }
    } catch (err) {
      console.error("error: ", err);
    }
  };

  useEffect(() => {
    let buyMeACoffee: Contract;
    isWalletConnected();
    getMemos();

    const onNewMemo = (
      from: string,
      timestamp: number,
      name: string,
      message: string
    ) => {
      console.log("memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name,
        },
      ]);
    };

    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(
        ethereum as any,
        "any"
      );
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(contractAddress, contractAbi, signer);
      buyMeACoffee.on("NewMemo", onNewMemo);
    }
    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Buy Amovane a Coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Buy Amovane a Coffee!</h1>

        {currentAccount ? (
          <div>
            <form>
              <div>
                <label>Name</label>
                <br />
                <input
                  id="name"
                  type="text"
                  placeholder="guy"
                  onChange={nameChanged}
                />
              </div>
              <div>
                <label>Send Amovane a message</label>
                <br />
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Enjoy your coffee!"
                  onChange={messageChanged}
                  required
                />
              </div>
              <div>
                <button type="button" onClick={buyCoffee}>
                  Send 1 coffee for 0.01 ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={connectWallet}>Connect your wallet</button>
        )}
      </main>

      {currentAccount && <h1>Memos Received</h1>}

      {currentAccount &&
        memos.map((memo, idx) => {
          return (
            <div
              key={idx}
              style={{
                border: "2px solid",
                borderRadius: "5px",
                padding: "5px",
                margin: "5px",
              }}
            >
              <p style={{ fontWeight: "bold" }}>{memo.message}</p>
              <p>
                From: {memo.name} at {memo.timestamp.toString()}
              </p>
            </div>
          );
        })}

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
};

export default Home;
