import { clusterApiUrl, Transaction, Connection } from '@solana/web3.js';
import axios from 'axios'
import test from './connectWallet';
import { Buffer } from 'buffer'
import setSelectedTags from './tagInput'
import getSelectedTags from './tagInput';
function getElement(id) {
  return document.getElementById(id)
}

let myPublicKey = null;
let revokeMintBool , revokeFreezeBool;
const net = clusterApiUrl('devnet')
console.log(net);

const form = getElement("token-form");
const imgInput = getElement("token-logo");
const imgUrl = getElement("img-url");
const imgDisplay = getElement("img-display");
const errorHandling = getElement("error-handling");
const loadingSpinner = getElement("loading-spinner");
const mediaFields = getElement("media-fields");
const mediaCheckbox = getElement("include-media");
const connectWalletButton = getElement("connect-wallets");
const notification = getElement("notification");
const walletAddressDisplay = getElement("wallet-address");
const connectWalletButtonDesktop = getElement("connect-wallet-desktop");
const connectWalletButtonMobile = getElement("connect-wallet-mobile");
const submitForm = getElement("submit");

const nameInput = getElement("token-name");
const symbolInput = getElement("token-symbol");
const totalSupplyInput = getElement("initial-supply");
const decimalsInput = getElement("decimals");
const descriptionInput = getElement("token-description");
const websiteInput = getElement("website");
const twitterInput = getElement("twitter");
const telegramInput = getElement("telegram");
const revokeFreeze = getElement("toggle-revokFreeze");
const revokeMint = getElement("toggle-revokMint");
const selectNetwork = getElement("network");
const creatorToggle = getElement('toggle-custom-creator-info');
const creatorFields = getElement('creator-fields')
const airdropSol = getElement('airdrop')

selectNetwork.addEventListener('change', ()=>{
  if (selectNetwork.value === "devnet") {
    airdropSol.classList.remove('hidden')
  } else {
    airdropSol.classList.add('hidden');
  }

})

creatorToggle.addEventListener('change', (event) => {
  if (event.target.checked) {
    creatorFields.classList.remove('hidden')
    
  } else {
    creatorFields.classList.add('hidden');
    
  }
});


revokeMint.addEventListener('change', (event) => {
  if (event.target.checked) {
    revokeMintBool = event.target.checked;
    console.log(revokeMintBool);
  } else {
    revokeMintBool = event.target.checked;
    console.log(revokeMintBool);
  }
});

revokeFreeze.addEventListener('change', (event) => {
  if (event.target.checked) {
    revokeFreezeBool = event.target.checked;
    console.log(revokeFreezeBool);
  } else {
    revokeFreezeBool = event.target.checked;
    console.log(revokeFreezeBool);
  }
})

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
    // document.getElementById('website').
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

submitForm.addEventListener("click", async () => {
  // event.preventDefault();
  console.log("test");
  // const test = {name: "ali" , lastName :"apg"};
  // const formData = new FormData(test);
  // console.log(formData);
  const metaDataforToken = {
    name: nameInput.value,
    symbol: symbolInput.value,
    image: imgUrl.textContent,
    description: descriptionInput.value,
    extensions: {
      website: websiteInput.value,
      twitter: twitterInput.value,
      telegram: telegramInput.value,
    },
    tags: getSelectedTags(),
    creator: {
      name: getElement('creatorName').value || "NoFaceMint",
      site: getElement('creatorWebsite').value || "https://nofacemint.com/",
    }
  };
  console.log(selectNetwork.value);
  let errors = {};
  let newTx;
  if (!metaDataforToken.name) errors.tokenName = "Token Name is required";
  if (!metaDataforToken.symbol) errors.tokenSymbol = "Token Symbol is required";
  if (!totalSupplyInput.value) errors.initialSupply = "Initial Supply is required";
  if (Number(totalSupplyInput.value) > 18000000000 || Number(totalSupplyInput.value) <= 0) errors.initialSupply = "Initial Supply must be between 1 and 18000000000";
  if (!decimalsInput.value) errors.decimals = "Decimals is required";
  if (Number(decimalsInput.value) == 0 || Number(decimalsInput.value) > 9) errors.decimals = "Decimals must be between 1 and 9";
  if (!metaDataforToken.description) errors.tokenDescription = "Token Description is required";
  if (!revokeMint.value) errors.mintAuthority = "Mint Authority is required";
  if (!revokeFreeze.value) errors.freezeAuthority = "Freeze Authority is required";
  if (!metaDataforToken.image) errors.tokenLogo = "Token Logo is required";
  if (!selectNetwork.value) errors.network = "Select Network";

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
      amount: totalSupplyInput.value,
      decimals: decimalsInput.value,
      metadata: ipfsUrl,
      symbol: symbolInput.value,
      tokenName: nameInput.value,
    };
    const network = selectNetwork.value;
    console.log("Token Info:", tokenInfo, revokeFreezeBool, revokeMintBool);
    myPublicKey = myPublicKey == null ? await test() : myPublicKey;

    await axios.post("https://createtoken.liara.run/createToken", { tokenInfo, revokeMintBool, revokeFreezeBool, myPublicKey , network })
      .then(async function (response) {
        console.log(response);
        let provider = getProvider()
        const network = net
        // "https://devnet.helius-rpc.com/?api-key=8a1383bc-5fba-4e84-8bde-894536d212c1";
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