import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl , Transaction , Connection } from '@solana/web3.js';
import axios from 'axios'
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("token-form");
  const imgInput = document.getElementById("token-logo");
  const imgUrl = document.getElementById("img-url");
  const imgDisplay = document.getElementById("img-display");
  const errorHandling = document.getElementById("error-handling");
  const notification = document.getElementById("notification");
  const loadingSpinner = document.getElementById("loading-spinner");
  const connectWalletButton = document.getElementById("connect-wallet");
  const walletAddressDisplay = document.getElementById("wallet-address");
  const mediaFields = document.getElementById("media-fields");
  const mediaCheckbox = document.getElementById("include-media");

  let myPublicKey = null;


  mediaCheckbox.addEventListener("change", (event) => {
    if (event.target.checked) {
      mediaFields.classList.remove("hidden");
    } else {
      mediaFields.classList.add("hidden");
    }
  });
  const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    console.log("Provider not found");
  };

  async function uploadToIPFS(file) {
    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({ name: "Token Image" });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({ cidVersion: 0 });
    formData.append("pinataOptions", options);

    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxContentLength: "Infinity",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: `Bearer ${import.meta.env.PINATA_JWT}`, // استفاده از متغیر محیطی
          },
        },
      );
      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  }

  async function uploadTokenDataToIPFS(tokenData) {
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        tokenData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.PINATA_JWT}`, // استفاده از متغیر محیطی
          },
        },
      );
      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading token data to IPFS:", error);
      throw error;
    }
  }

  function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg text-white ${isError ? "bg-red-600" : "bg-green-600"} block`;
    setTimeout(() => {
      notification.className = "hidden";
    }, 3000);
  }

  imgInput.addEventListener("change", async (e) => {
    e.preventDefault();
    const file = e.target.files[0];

    loadingSpinner.classList.remove("hidden");

    try {
      const url = await uploadToIPFS(file);
      imgUrl.textContent = url;
      imgDisplay.src = url;
      imgDisplay.style.display = "block";

      showNotification("Image uploaded successfully");
    } catch (error) {
      errorHandling.textContent = "Error uploading image to IPFS";
      showNotification("Error uploading image to IPFS", true);
    } finally {
      loadingSpinner.classList.add("hidden");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const metaDataforToken = {
      name: formData.get("token-name"),
      symbol: formData.get("token-symbol"),
      image: imgUrl.textContent,
      description: `Dive into the movement for unity throughout the galaxy with #SharkRush`,
      extensions: {
        website: formData.get("website"),
        twitter: formData.get("twitter"),
        telegram: formData.get("telegram"),
      },
      tags: formData.get("tags").split(','),
      creator: {
        name: "SharkRush Team",
        site: "https://rushingmarkapp.monster/",
      }
    };

    let errors = {};
    let newTx;
    if (!metaDataforToken.name) errors.tokenName = "Token Name is required";
    if (!metaDataforToken.symbol) errors.tokenSymbol = "Token Symbol is required";
    if (!formData.get("initial-supply")) errors.initialSupply = "Initial Supply is required";
    if (!formData.get("decimals")) errors.decimals = "Decimals is required";
    if (!metaDataforToken.description) errors.tokenDescription = "Token Description is required";
    if (!formData.get("mint-authority")) errors.mintAuthority = "Mint Authority is required";
    if (!formData.get("freeze-authority")) errors.freezeAuthority = "Freeze Authority is required";
    if (!metaDataforToken.image) errors.tokenLogo = "Token Logo is required";

    if (Object.keys(errors).length > 0) {
      console.error("Form validation errors:", errors);
      alert(JSON.stringify(errors));
      return;
    }

    loadingSpinner.classList.remove("hidden");

    try {
      const ipfsUrl = await uploadTokenDataToIPFS(metaDataforToken);
      console.log("Token Data IPFS URL:", ipfsUrl);

      const tokenInfo = {
        amount: formData.get("initial-supply"),
        decimals: formData.get("decimals"),
        metadata: ipfsUrl,
        symbol: formData.get("token-symbol"),
        tokenName: formData.get("token-name"),
      };
      const revokeFreezeBool = formData.get("freeze-authority") === "true" ? true : false;
      const revokeMintBool = formData.get("mint-authority") === "true" ? true : false;
      console.log("Token Info:", tokenInfo, revokeFreezeBool, revokeMintBool);

      // ارسال داده‌های نهایی به بک‌اند
      await axios.post("http://localhost:3000/createToken", { tokenInfo, revokeMintBool, revokeFreezeBool, myPublicKey })
        .then(async function (response) {
          console.log(response);
          let provider = getProvider()
          const network = "https://devnet.helius-rpc.com/?api-key=8a1383bc-5fba-4e84-8bde-894536d212c1";
          const connection = new Connection(network);
          newTx = response.data.serializedTransaction;
          const transaction = Transaction.from(Buffer.from(newTx, 'base64'));
          console.log("newTx:", newTx);

          const signedTransaction = await provider.signTransaction(transaction);
          console.log(signedTransaction);
          const signature = await connection.sendRawTransaction(signedTransaction.serialize());
          console.log(signature);
        })
        .catch(function (error) {
          console.log(error);
        });

      showNotification("Token data uploaded successfully and sent to backend");
    } catch (error) {
      errorHandling.textContent = "Error uploading token data to IPFS or sending to backend";
      showNotification("Error uploading token data to IPFS or sending to backend", true);
    } finally {
      loadingSpinner.classList.add("hidden");
    }
  });

  connectWalletButton.addEventListener("click", async () => {
    try {
      const { publicKey } = await window.solana.connect();
      myPublicKey = publicKey.toString();
      walletAddressDisplay.textContent = `Wallet Address: ${myPublicKey}`;
      showNotification("Wallet connected successfully");
    } catch (error) {
      console.log(error);
      errorHandling.textContent = "Error connecting to wallet";
      showNotification("Error connecting to wallet", true);
    }
  });
});
