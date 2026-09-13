import React from 'react';
import {createRoot} from 'react-dom/client';
import Builder from '../app/builder';
import '../app/globals.css';
class AppBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main className="policy-page"><h1>The builder could not open</h1><p>Your saved device data has not been erased. Reopen the app or contact support if this continues.</p><button onClick={()=>window.location.reload()}>Try again</button><p><a href="mailto:johnprodromidis1@gmail.com?subject=Build%20Lab%20support">Contact support</a></p></main>:this.props.children;}
}
createRoot(document.getElementById('root')!).render(<AppBoundary><Builder storageMode="device"/></AppBoundary>);
