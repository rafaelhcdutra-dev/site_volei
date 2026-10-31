const FRONT=[1,2,3],BACK=[0,4,5];
const mkRoles=(p,ab,cl,n)=>{const o={};for(let i=1;i<=n;i++)o[p+i]=[(p==='A'?'Atacante ':p==='S'?'Levantador ':'Jogador ')+i,ab,cl];return o};
const SYS={
'5x1':{roles:{S:['Levantador','LEV','s'],O:['Oposto','OPO','o'],P1:['Ponteiro 1','PON','p'],P2:['Ponteiro 2','PON','p'],C1:['Central 1','CEN','c2'],C2:['Central 2','CEN','c2']},line:['S','P1','C1','O','P2','C2'],setters:['S'],libOn:true,repl:['C1','C2']},
'4x2':{roles:Object.assign(mkRoles('S','LEV','s',2),mkRoles('A','ATA','a',4)),line:['S1','A1','A2','S2','A3','A4'],setters:['S1','S2'],libOn:false,repl:['A2','A4']},
'6x0':{roles:mkRoles('J','JOG','j',6),line:['J1','J2','J3','J4','J5','J6'],setters:[],libOn:false,repl:['J3','J6']}
};
const LIB=['Líbero','LIB','l'];
const BASE=[[.84,.76],[.84,.2],[.5,.2],[.16,.2],[.16,.76],[.5,.76]];
const REC=[[.82,.58],[.86,.17],[.52,.2],[.14,.22],[.2,.62],[.52,.7]];
const RECS=[[.9,.34],[.9,.08],[.62,.1],[.12,.1],[.3,.5],[.64,.42]];
const ATKB=[[.84,.66],null,null,null,[.16,.66],[.5,.74]];
const ZN={L:[.12,'Ponta esquerda (4)'],M:[.46,'Meio (3)'],R:[.9,'Direita (2)'],P:[.5,'Pipe (6)']};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=v=>Math.max(.03,Math.min(.97,v));
let st={sys:'5x1',rot:0,ph:'fixa',names:{},lib:{},ov:{},msg:''};
let drag=null;
try{const s=JSON.parse(localStorage.getItem('volei-rotacoes')||'null');if(s){st.sys=SYS[s.sys]?s.sys:'5x1';st.names=s.names||{};st.lib=s.lib||{}}}catch(e){}
function save(){try{localStorage.setItem('volei-rotacoes',JSON.stringify({sys:st.sys,names:st.names,lib:st.lib}))}catch(e){}}
const S=()=>SYS[st.sys];
function lb(){if(!st.lib[st.sys])st.lib[st.sys]={on:S().libOn,repl:S().repl.slice()};return st.lib[st.sys]}
const rc=id=>id==='L'?LIB:S().roles[id];
function nm(id){return(((st.names[st.sys]||{})[id])||'').trim()||rc(id)[0]}
function lineAt(rot){const a=S().line.slice();for(let k=0;k<rot;k++)a.push(a.shift());return a}
function arrange(rot){
 if(rot===undefined)rot=st.rot;
 const l=lb(),items=lineAt(rot).map((id,i)=>{const lib=l.on&&BACK.includes(i)&&l.repl.includes(id);return{i,id,show:lib?'L':id,lib,set:false}});
 let si;
 if(st.sys==='5x1')si=items.findIndex(x=>x.id==='S');
 else if(st.sys==='4x2')si=items.findIndex(x=>S().setters.includes(x.id)&&FRONT.includes(x.i));
 else si=2;
 items[si].set=true;
 return items;
}
function atkPos(items){
 const pos=[],s=items.find(x=>x.set),sf=FRONT.includes(s.i);
 const hit=items.filter(x=>FRONT.includes(x.i)&&!x.set),tg={};
 if(st.sys==='5x1'){hit.forEach(x=>{const c=rc(x.show)[2];tg[x.i]=c==='p'?.12:c==='c2'?(sf?.45:.5):.9})}
 else{const xs=hit.length===3?[.12,.5,.88]:[.12,.45];hit.sort((a,b)=>BASE[a.i][0]-BASE[b.i][0]).forEach((x,k)=>{tg[x.i]=xs[k]})}
 items.forEach(x=>{pos[x.i]=x.set?[.72,.08]:(tg[x.i]!==undefined?[tg[x.i],.1]:ATKB[x.i].slice())});
 return pos;
}
function positions(items){
 let pos=[];
 if(st.ph==='fixa')items.forEach(x=>{pos[x.i]=BASE[x.i].slice()});
 else if(st.ph==='rec')items.forEach(x=>{pos[x.i]=(x.set?RECS:REC)[x.i].slice()});
 else pos=atkPos(items);
 Object.keys(st.ov).forEach(k=>{pos[k]=st.ov[k].slice()});
 return pos;
}
function check(pos){
 const e=[];
 [[3,4,'P4','P5'],[2,5,'P3','P6'],[1,0,'P2','P1']].forEach(([f,b,fn,bn])=>{if(!(pos[f][1]<pos[b][1]))e.push(fn+' (frente) precisa ficar mais perto da rede que '+bn+' (fundo)')});
 if(!(pos[3][0]<pos[2][0]&&pos[2][0]<pos[1][0]))e.push('Linha da frente fora de ordem: P4 à esquerda de P3, e P3 à esquerda de P2');
 if(!(pos[4][0]<pos[5][0]&&pos[5][0]<pos[0][0]))e.push('Linha de fundo fora de ordem: P5 à esquerda de P6, e P6 à esquerda de P1');
 return e;
}
function play(z){
 const items=arrange(),pos=positions(items),s=items.find(x=>x.set);
 let cand;
 if(z==='P')cand=items.filter(x=>BACK.includes(x.i)&&!x.set&&!x.lib&&!S().setters.includes(x.id)).sort((a,b)=>Math.abs(BASE[a.i][0]-.5)-Math.abs(BASE[b.i][0]-.5));
 else cand=items.filter(x=>FRONT.includes(x.i)&&!x.set).sort((a,b)=>Math.abs(pos[a.i][0]-ZN[z][0])-Math.abs(pos[b.i][0]-ZN[z][0]));
 if(!cand.length){st.ov={};st.msg='Nesta rotação não há atacante disponível para essa jogada.';render();return}
 const h=cand[0];
 st.ov={};if(z==='P')st.ov[h.i]=[.5,.46];
 st.msg=esc(nm(s.show))+' levanta para '+esc(nm(h.show))+': '+ZN[z][1]+'.';
 render();
 const from=pos[s.i],to=st.ov[h.i]||pos[h.i],b=$('ball');
 b.style.transition='none';b.style.opacity='0';b.style.left=from[0]*100+'%';b.style.top=from[1]*100+'%';
 setTimeout(()=>{b.style.opacity='1';void b.offsetWidth;b.style.transition='left .7s ease-in-out,top .7s ease-in-out';b.style.left=to[0]*100+'%';b.style.top=to[1]*100+'%'},z==='P'?450:80);
}
function resetView(){st.ov={};st.msg='';$('ball').style.opacity='0'}
function mk(box,list,cur,cb){box.innerHTML='';list.forEach(([k,t])=>{const b=document.createElement('button');b.textContent=t;b.className=k===cur?'on':'';b.onclick=()=>cb(k);box.appendChild(b)})}
function buildRepl(){
 const l=lb();
 $('libOn').checked=l.on;
 $('replBox').style.display=l.on?'block':'none';
 $('repl').innerHTML=Object.keys(S().roles).filter(id=>!S().setters.includes(id)).map(id=>'<label class="chk"><input type="checkbox" data-id="'+id+'"'+(l.repl.includes(id)?' checked':'')+'> '+esc(nm(id))+'</label>').join('');
}
function buildNames(){
 const sn=st.names[st.sys]||{};
 $('names').innerHTML=Object.keys(S().roles).concat('L').map(id=>{const r=rc(id);return '<label class="nm '+r[2]+'"><span class="dot"></span><span class="rl">'+esc(r[0])+'</span><input data-id="'+id+'" maxlength="18" placeholder="Nome" value="'+esc(sn[id]||'')+'"></label>'}).join('');
}
function render(){
 mk($('sysBtns'),[['5x1','5x1'],['4x2','4x2'],['6x0','6x0']],st.sys,k=>{st.sys=k;st.rot=0;resetView();save();buildNames();render()});
 mk($('rotBtns'),[0,1,2,3,4,5].map(r=>[r,'R'+(r+1)]),st.rot,k=>{st.rot=k;resetView();render()});
 mk($('phBtns'),[['fixa','Posições fixas'],['rec','Recepção'],['ata','Ataque e jogadas']],st.ph,k=>{st.ph=k;resetView();render()});
 mk($('plays'),Object.keys(ZN).map(k=>[k,ZN[k][1]]),null,play);
 $('plays').style.display=st.ph==='ata'?'flex':'none';
 buildRepl();
 const items=arrange(),pos=positions(items),court=$('court');
 court.className='court'+(st.ph==='rec'?' rec':'')+(drag!==null?' drag':'');
 items.forEach(x=>{
  const el=pls[x.i],r=rc(x.show),p=pos[x.i];
  el.style.left=p[0]*100+'%';el.style.top=p[1]*100+'%';
  el.className='pl '+r[2]+(x.set?' set':'');
  el.innerHTML='<span class="c">'+r[1]+'<i>P'+(x.i+1)+'</i></span><span class="n">'+esc(nm(x.show))+'</span>';
 });
 const s=items.find(x=>x.set);
 $('info').textContent='Rotação '+(st.rot+1)+(st.sys==='6x0'?' · levanta quem está no P3':' · levantador da vez no P'+(s.i+1));
 let m;
 if(st.ph==='ata')m=st.msg||'Depois do saque os jogadores podem se mover livremente. Escolha uma jogada para ver a bola do levantador até o atacante.';
 else{const e=check(pos);m=e.length?'<b class="bad">⚠ Posição ilegal (sobreposição):</b> '+e.map(esc).join(' • '):'<b class="ok">✔ Formação legal pelas regras de posição da FIVB.</b>';if(st.ph==='rec')m+=' Arraste os jogadores para testar.';else m+=' Esta é a ordem de rotação conferida pelo árbitro no saque.'}
 if(st.ph!=='ata'&&items[0].lib)m+='<br>ℹ Líbero no P1 (saque): a possibilidade de o líbero sacar depende do regulamento da competição.';
 $('msg').innerHTML=m;
 const ORD=[3,2,1,4,5,0];
 let h='<tr><th></th><th colspan="3">Frente (rede)</th><th colspan="3">Fundo</th></tr><tr><th></th>'+ORD.map(i=>'<th>P'+(i+1)+'</th>').join('')+'</tr>';
 for(let r=0;r<6;r++){const it=arrange(r);h+='<tr data-r="'+r+'" class="'+(r===st.rot?'cur':'')+'"><th>R'+(r+1)+'</th>'+ORD.map(i=>'<td class="'+(it[i].set?'st':'')+'">'+esc(nm(it[i].show))+(it[i].lib?' (L)':'')+'</td>').join('')+'</tr>'}
 $('tbl').innerHTML=h;
}
const pls=[];
for(let i=0;i<6;i++){
 const el=document.createElement('div');el.className='pl';$('court').appendChild(el);pls.push(el);
 el.addEventListener('pointerdown',e=>{if(st.ph!=='rec')return;e.preventDefault();drag=i;$('court').classList.add('drag')});
}
document.addEventListener('pointermove',e=>{
 if(drag===null)return;
 const r=$('court').getBoundingClientRect();
 st.ov[drag]=[clamp((e.clientX-r.left)/r.width),clamp((e.clientY-r.top)/r.height)];
 render();
});
const endDrag=()=>{if(drag!==null){drag=null;render()}};
document.addEventListener('pointerup',endDrag);
document.addEventListener('pointercancel',endDrag);
$('prev').onclick=()=>{st.rot=(st.rot+5)%6;resetView();render()};
$('next').onclick=()=>{st.rot=(st.rot+1)%6;resetView();render()};
$('libOn').addEventListener('change',e=>{lb().on=e.target.checked;resetView();save();render()});
$('repl').addEventListener('change',e=>{
 const l=lb(),id=e.target.dataset.id;
 l.repl=l.repl.filter(x=>x!==id);if(e.target.checked)l.repl.push(id);
 save();render();
});
$('names').addEventListener('input',e=>{
 const id=e.target.dataset.id;if(!id)return;
 (st.names[st.sys]=st.names[st.sys]||{})[id]=e.target.value;
 save();render();
});
$('clear').onclick=()=>{st.names[st.sys]={};save();buildNames();render()};
$('tbl').addEventListener('click',e=>{
 const tr=e.target.closest?e.target.closest('tr[data-r]'):null;
 if(tr){st.rot=+tr.dataset.r;resetView();render()}
});
buildNames();
render();