require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const { ethers } = require('ethers');
const { exec } = require('child_process');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3001; // diferent port from main server

////set api key (environment variable for security reasons)
const provider = new ethers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`
);

//set contract address
const CONTRACT_ADDRESS = "0xD10F1517Ff4DcC47b745358113a5731EAb1b02D0";
const ABI = [
    "function ownerOf(uint256 tokenId) view returns (address)"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
const TOKEN_ID = 1; // assuming single NFT


app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// for uploading encoded image
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

//I am keeping this value static for simplicity of encoding and decoding
// but it is more secure if this is a nonce
app.get("/challenge", (req, res) => {
    const { address } = req.query;

    const message = "Crypto1sFun!";

    res.json({ message });
});


app.post("/verify", async (req, res) => {
    const { address, signature, message } = req.body;

    try {

	// Get wallet address from signature
        const recoveredAddress = ethers.verifyMessage(message, signature);

        //make sure that the signer address is the same as the wallett that was added
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.json({ success: false });
        }

        // Get NFT owner from blockchain
        const owner = await contract.ownerOf(TOKEN_ID);

	// Compare signature with NFT owner
        if (owner.toLowerCase() !== recoveredAddress.toLowerCase()) {
            return res.json({ success: false });
        }

        // If ownership verified, allow a session
        req.session.verifiedOwner = true;
        req.session.ownerAddress = recoveredAddress;
	req.session.signature = signature;

        return res.json({ success: true });

    } catch (err) {
        console.error("Verification error:", err);
        return res.json({ success: false });
    }
});

// Decode page (upload NFT image)
app.get("/decode", (req, res) => {
    // require a session for access
    if (!req.session || !req.session.verifiedOwner) {
        return res.status(403).send("Access denied. You do not own this NFT.");
    }
    res.sendFile(path.join(__dirname, "views", "decode.html"));
});

// Handle uploaded encoded NFT
app.post("/decode", upload.single('nftImage'), (req, res) => {
    if (!req.session || !req.session.verifiedOwner) {
        return res.status(403).send("Access denied. You do not own this NFT.");
    }

    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const uploadedPath = req.file.path;
    const signature = req.session.signature;

    // Run decode.py on the uploaded image
    const command = `python3 scripts/decode.py "${signature}" "${uploadedPath}"`;

    exec(command, (error, stdout, stderr) => {
        // Delete uploaded file after processing
        fs.unlinkSync(uploadedPath);

        if (error) {
            console.error("Decoding error:", error, stderr);
            return res.status(500).send("Error decoding NFT image.");
        }

        // present decoded message
        res.send(`
            <h2>Decoded Message:</h2>
            <pre>${stdout}</pre>
            <a href="/decode">Go Back</a>
        `);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Decode server running at http://localhost:${PORT}`);
});
