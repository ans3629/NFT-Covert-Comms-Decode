# NFT-Covert-Comms-Decode
**Code for decoding covert communications using NFTs**     
This is the code for the secondary  server of a covert communications channel which hosts an NFT and embeds the NFT with a secret message using the signature of the NFT owner's crypto wallet. This web server has two pages:            
/login: for the NFT owner to log in. This page connects to the user's crypto wallet, collects a signature, compares the signature public key derived from the signature against the NFT owner according to the blockchain.      
/decode: Once the owner has logged in, they are redirected to the /decode page where they can upload the version of the image which has the message embedded (collected from the primary server). Once the message is uploaded, the server will use the owner's signature to read the correct pixels in the correct order to decode the message. The message will be presented on this page, completing the covert commnication channel.              

For more information on how the encoded image is acquired, view my NFT-Covert-Comms repo.      

**Technical Details**        

.env file must contain:        
INFURA\_KEY     
SESSION\_SECRET     

The Infura key is an API key that is used to query the blockchain. In this case, I chose to use Infura, but there are other blockchain API sites available as well.       

The session secret is a string that is used when creating the session. You can choose the string.             

If using the covert channel, you will have to mint an original NFT to the blockchain. I minted my NFT on Ethereum Sepolia so it did not cost any money. Since NFT ownership is required for the channel to work, you will never be able to log in to this server when testing ownership of my NFT (because I am the owner). To change the NFT contract address, modify the CONTRACT\_ADDRESS variable in server.js.       

Dependencies:      
npm install dotenv express express-session ethers multer        

**Security Concerns**        
It is not recommended that this code is implemented for public use without adding additional security features. This code is provided as a proof of concept only and should be modified before being used in a real world application.  
