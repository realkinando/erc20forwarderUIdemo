import Header from './components/Header';
import TokenSend from './components/TokenSend';
import reducer from './reducers/reducer';
import Token from './utils/TokenWallet';
import web3Modal from './utils/web3Modal';
import { ThemeProvider, CSSReset, Box, Text, Button} from '@chakra-ui/core';
import { ethers } from "ethers";
import {useReducer} from "react";
import Explainer from './components/Explainer';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/core";
import { CircularProgress, CircularProgressLabel } from "@chakra-ui/core";

function App() {
  console.log(reducer);
  const [store, dispatch] = useReducer(reducer,{
    loggedIn:false,
    loading:false,
    txModal:false,
    tokenBalance:0,
    transferDestination:"",
    txHash:""
});

  const headerButtonFunction = async() => {
    if (store.loggedIn){
      console.log(store);
      dispatch({type:'LOGOUT_MODAL'});
    }
    else{
      try{
        const walletModal = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(walletModal);
        const wallet = provider.getSigner();
        const address = await wallet.getAddress();
        const tokenWallet = new Token(provider);
        const balance = (parseFloat((await tokenWallet.token.balanceOf(address)).toString())/(Math.pow(10,18))).toFixed(2);
        const transferHandlerApproved = await tokenWallet.transferHandlerApproved(address);
        const feeProxyApproved = await tokenWallet.feeProxyApproved(address);
        dispatch({type:'LOGIN', tokenWallet:tokenWallet, address:address, tokenBalance:balance, 
                  transferHandlerApproved:transferHandlerApproved,feeProxyApproved:feeProxyApproved});
      }
      catch(error){
        console.log(error);
      }
    }
  }

  const logOut = () => {
    dispatch({type:'LOGOUT'})
  }

  const cancelLogOut = () => {
    dispatch({type:'CANCEL_LOGOUT_MODAL'})
  }

  const cancelTx = () => {
    dispatch({type:'CANCEL_TX_MODAL'})
  }

  const submitTx = async() => {
    dispatch({type:'CANCEL_TX_MODAL'});
    dispatch({type:'LOADING'});
    try{
      const txHash = await store.tokenWallet.forwardTransfer(ethers.utils.parseEther(store.transferAmount),store.transferDestination);
      const newBalance = (parseFloat((await store.tokenWallet.token.balanceOf(store.address)).toString())/(Math.pow(10,18))).toFixed(2);
      console.log(txHash);
      dispatch({type:'UPDATE_BALANCE',tokenBalance:newBalance});
      dispatch({type:'TX_HASH',txHash:txHash});
    }
    catch(error){
      console.log(error);
    }
    dispatch({type:'NOT_LOADING'});
  }

  const viewEtherscan = () => {
    window.open("https://kovan.etherscan.io/tx/"+store.txHash);
  }

  return (
    <ThemeProvider>
      <CSSReset />

      <Modal isOpen={store.txModal} onClose={cancelTx}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Details</ModalHeader>
          <ModalBody>
            <Text fontWeight="600" fontSize="3xl">You're sending ◈{store.transferAmount}</Text>
  <Text fontSize="2xl">to {store.transferDestination.substring(0, 7)}......{store.transferDestination.substring(store.transferDestination.length-6)}</Text><br></br>
            <Text fontSize="2xl">(paying a ◈{store.transferFee} fee)</Text>
          </ModalBody>
          <ModalFooter>
            <Button variantColor="red" mr={3} onClick={cancelTx}>
              CANCEL
            </Button>
            <Button variantColor="blue" onClick={submitTx}>CONFIRM</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={store.logOutModal} onClose={cancelLogOut}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Log Out?</ModalHeader>
          <ModalFooter>
            <Button variantColor="red" mr={3} onClick={logOut}>
              Yes
            </Button>
            <Button variantColor="blue" onClick={cancelLogOut}>No</Button>
          </ModalFooter>
          <ModalHeader>Previous Transaction</ModalHeader>
          <Button variantColor="blue" onClick={viewEtherscan}>View On Etherscan</Button>
        </ModalContent>
      </Modal>

      <Modal isOpen={store.loading}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <CircularProgress size="240px" isIndeterminate color="green"></CircularProgress>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Header buttonText={store.loggedIn?store.address:"Login"} onClickFunction={headerButtonFunction} />
      <Box pt="50px">

        <Box boxShadow="lg" borderRadius="20px" p="40px" w="500px" my="auto" mx="auto" color="black" bg="orange.100">
          <Explainer loggedIn={store.loggedIn}/>
          <TokenSend store={store} dispatch={dispatch}/>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
