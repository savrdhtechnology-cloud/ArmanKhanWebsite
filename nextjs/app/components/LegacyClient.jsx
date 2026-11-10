'use client';
import dynamic from 'next/dynamic';
const LegacySite=dynamic(()=>import('../../../frontend/src/App'),{ssr:false,loading:()=> <div style={{minHeight:'100vh',background:'#050505',color:'#c9a961',display:'grid',placeItems:'center'}}>Loading Arman Hair Studio…</div>});
export default function LegacyClient(){return <LegacySite/>}
