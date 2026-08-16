const express=require("express");
const cors=require("cors");
const path=require("path");
const app=express();
app.use(cors()); app.use(express.json());
const PORT=process.env.PORT||3000;
const PAYMENTS_ENABLED=String(process.env.PAYMENTS_ENABLED||"false").toLowerCase()==="true";

const state={
 tournaments:[
  {id:1,name:"Night Warriors #01",mode:"FULL_MAP",entry:10,slots:40,joined:32,status:"LIVE",start:"Today 8:00 PM"},
  {id:2,name:"Victory Clash #02",mode:"CLASH_SQUAD",entry:20,slots:24,joined:18,status:"UPCOMING",start:"Tomorrow 6:00 PM"}
 ],
 wallet:{deposit:500,winning:250},
 banners:[
  {id:1,title:"Festival Special",position:"TOP",rotation:3,active:true}
 ],
 complaints:[]
};

app.get("/api/health",(req,res)=>res.json({ok:true,service:"freefire-victory-backend",paymentsEnabled:PAYMENTS_ENABLED}));
app.get("/api/payment-settings",(req,res)=>res.json({enabled:PAYMENTS_ENABLED}));
app.get("/api/tournaments",(req,res)=>res.json(state.tournaments));
app.post("/api/tournaments",(req,res)=>{
 const b=req.body||{}; const t={id:Date.now(),name:b.name||"New Tournament",mode:b.mode||"FULL_MAP",
 entry:Number(b.entry||10),slots:Number(b.slots||40),joined:0,status:"UPCOMING",start:b.start||""};
 state.tournaments.push(t); res.status(201).json(t);
});
app.post("/api/tournaments/:id/join",(req,res)=>{
 const t=state.tournaments.find(x=>x.id===Number(req.params.id));
 if(!t)return res.status(404).json({error:"Tournament not found"});
 if(t.joined>=t.slots)return res.status(409).json({error:"FULL"});
 if(state.wallet.deposit < t.entry)return res.status(402).json({error:"INSUFFICIENT_WALLET"});
 state.wallet.deposit-=t.entry; t.joined++;
 res.json({ok:true,tournament:t,wallet:state.wallet});
});
app.get("/api/wallet",(req,res)=>res.json(state.wallet));
app.post("/api/wallet/deposit",(req,res)=>{
 if(!PAYMENTS_ENABLED)return res.status(503).json({error:"PAYMENTS_DISABLED"});
 const amount=Number(req.body?.amount||0);
 if(amount<10)return res.status(400).json({error:"MINIMUM_DEPOSIT_10"});
 state.wallet.deposit+=amount; res.json({ok:true,wallet:state.wallet});
});
app.post("/api/withdraw",(req,res)=>{
 const source=req.body?.source; const amount=Number(req.body?.amount||0);
 if(amount<100)return res.status(400).json({error:"MINIMUM_WITHDRAWAL_100"});
 if(source==="WINNING"){
   if(state.wallet.winning<amount)return res.status(400).json({error:"INSUFFICIENT_WINNING_BALANCE"});
   state.wallet.winning-=amount; return res.json({ok:true,fee:0,net:amount,wallet:state.wallet});
 }
 if(source==="DEPOSIT"){
   if(state.wallet.deposit<amount)return res.status(400).json({error:"INSUFFICIENT_DEPOSIT_BALANCE"});
   const fee=amount*0.10, net=amount-fee;
   state.wallet.deposit-=amount;
   return res.json({ok:true,fee,net,wallet:state.wallet,approval:"ADMIN_REQUIRED"});
 }
 res.status(400).json({error:"INVALID_SOURCE"});
});
app.get("/api/banners",(req,res)=>res.json(state.banners));
app.post("/api/banners",(req,res)=>{
 const b={id:Date.now(),title:req.body?.title||"Promotion",position:req.body?.position||"TOP",rotation:3,active:true};
 state.banners.push(b);res.status(201).json(b);
});
app.get("/api/complaints",(req,res)=>res.json(state.complaints));
app.post("/api/complaints",(req,res)=>{
 const c={id:Date.now(),player:req.body?.player||"Player",issue:req.body?.issue||"Support request",status:"OPEN"};
 state.complaints.push(c);res.status(201).json(c);
});
app.use("/web",express.static(path.join(__dirname,"../apps/web")));
app.use("/admin",express.static(path.join(__dirname,"../apps/admin")));
app.use("/app",express.static(path.join(__dirname,"../apps/player")));
app.listen(PORT,()=>console.log(`FREEFIRE VICTORY backend running on http://localhost:${PORT}`));
