import { clusterApiUrl, Transaction, Connection } from '@solana/web3.js';
import axios from 'axios'
import test from './connectWallet';
import { Buffer} from 'buffer'
let myPublicKey = null;

const form = document.getElementById("token-form");
const imgInput = document.getElementById("token-logo");
const imgUrl = document.getElementById("img-url");
const imgDisplay = document.getElementById("img-display");
const errorHandling = document.getElementById("error-handling");
const loadingSpinner = document.getElementById("loading-spinner");
const mediaFields = document.getElementById("media-fields");
const mediaCheckbox = document.getElementById("include-media");
const connectWalletButton = document.getElementById("connect-wallets");
const notification = document.getElementById("notification");
const walletAddressDisplay = document.getElementById("wallet-address");
const connectWalletButtonDesktop = document.getElementById("connect-wallet-desktop");
const connectWalletButtonMobile = document.getElementById("connect-wallet-mobile");
const submitForm = document.getElementById("submit")

function showNotification(message, isError = false) {
  notification.textContent = message;
  notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg text-white ${isError ? "bg-red-600" : "bg-green-600"} block`;
  setTimeout(() => {
    notification.className = "hidden";
  }, 5000);
}
mediaCheckbox.addEventListener("change", (event) => {
  if (event.target.checked) {
    mediaFields.classList.remove("hidden");
  } else {
    mediaFields.classList.add("hidden");
    document.getElementById('website').removeAttribute('Required');
    document.getElementById('twitter').removeAttribute('Required');
    document.getElementById('telegram').removeAttribute('Required');
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



function formatErrors(errors) {
  return Object.values(errors).join(", ");
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

submitForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.log("fuck");

  const formData = new FormData(form);

  const metaDataforToken = {
    name: formData.get("token-name"),
    symbol: formData.get("token-symbol"),
    image: imgUrl.textContent,
    description: formData.get('token-description'),
    extensions: {
      website: formData.get("website"),
      twitter: formData.get("twitter"),
      telegram: formData.get("telegram"),
    },
    tags: formData.get("tags").split(','),
    creator: {
      name: "NoFaceMint",
      site: "https://nofacemint.com/",
    }
  };

  let errors = {};
  let newTx;
  if (!metaDataforToken.name) errors.tokenName = "Token Name is required";
  if (!metaDataforToken.symbol) errors.tokenSymbol = "Token Symbol is required";
  if (!formData.get("initial-supply")) errors.initialSupply = "Initial Supply is required";
  if (Number(formData.get("initial-supply")) > 18000000000 || Number(formData.get("initial-supply")) <= 0) errors.initialSupply = "Initial Supply must be between 1 and 18000000000";
  if (!formData.get("decimals")) errors.decimals = "Decimals is required";
  if (Number(formData.get("decimals")) == 0 || Number(formData.get("decimals")) > 9) errors.decimals = "Decimals must be between 1 and 9";
  if (!metaDataforToken.description) errors.tokenDescription = "Token Description is required";
  if (!formData.get("mint-authority")) errors.mintAuthority = "Mint Authority is required";
  if (!formData.get("freeze-authority")) errors.freezeAuthority = "Freeze Authority is required";
  if (!metaDataforToken.image) errors.tokenLogo = "Token Logo is required";

  if (Object.keys(errors).length > 0) {
    console.error("Form validation errors:", errors);
    showNotification(formatErrors(errors), true);
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
    myPublicKey = myPublicKey == null ? await test() : myPublicKey;

    await axios.post("https://createtoken.liara.run/createToken", { tokenInfo, revokeMintBool, revokeFreezeBool, myPublicKey })
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
        showNotification("Your token has been successfully created! You can now manage and distribute your new token.");
      })
      .catch(function (error) {
        console.log(error);
        showNotification("An error occurred while creating your token. Please try again later.", true);
      });


  } catch (error) {
    errorHandling.textContent = "Error uploading token data to IPFS or sending to backend";
    showNotification("Error uploading token data to IPFS or sending to backend", true);
  } finally {
    loadingSpinner.classList.add("hidden");
  }
});



connectWalletButton.addEventListener("click", async () => {
  console.log("ok");
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

export default showNotification;