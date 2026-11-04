/* MATCH, Task 2: "The Chapel at Midnight" quest engine (version 2, the simple one).
 *
 * preview.html loads this file before its own script and creates one engine
 * with MATCH_CHAPEL_ENGINE.create(api). The game then calls a few hooks, all
 * marked "Task 2" in preview.html. If this file is missing, every hook is
 * skipped and the game runs as before.
 *
 * All quest state lives in world.chapel, so it is saved, loaded and reset
 * with the rest of the run. Text and tuning numbers live in chapel_at_midnight.json.
 *
 * The quest, in short:
 *  - It happens in about half of runs. The case opens when you see the flyer in the
 *    paper (signed only V.B.). Matching with Victoria Blackwood on Hinge starts her
 *    seven-night clock early, but says nothing. You can only talk to her once matched.
 *  - Nothing names Victoria as the host until someone tells you: a goth girl, a flyer
 *    girl on the phone, or Victoria herself when you ask about the flyers.
 *  - Two things to find out: WHICH NIGHT (ask a goth, a Sister, or wait for a goth
 *    friend to text you the countdown) and WHERE (one of three old chapels, listed in
 *    the case file once a clue points at a chapel). The Sisters take word only once
 *    you have both.
 *  - Clues come from goth girls you've befriended (the three on the flyer, and any
 *    goth you match with), from Victoria if she trusts you, and from the paper.
 *  - You answer by sending word to the Sisters of Mercy (a Sister on Hinge, St
 *    Brigid's line or the case file once you can reach them).
 *  - Stop the rite and Victoria is arrested at the chapel door; a goth girl who liked
 *    how you handled it asks you out, and saying yes wins the game.
 *  - Victoria hears things. Criticise her to the wrong girl, ask too many people,
 *    tell the wrong girl about the Sisters, confront her, back out on her, go to her
 *    rite alone, or let the rite happen once she knows you: she comes for you.
 *    Nothing tells you how close she is.
 */
(function(root){
  'use strict';
  const LIGHTING={'bedroom-dusk':'dusk','bedroom-night':'night','bedroom-morning':'morning','bedroom-afternoon':'afternoon'};
  const STAGES=['threshold','charge','lunge'];
  const VICTORIA='MATCH-003';
  const FLYER_GOTHS=['MATCH-061','MATCH-062','MATCH-063'];
  const FLYER_NUMBERS=['MATCH-061','MATCH-062']; // the DJ's bookings line and the Black Lace shop are printed on the flyer
  const PLACES=['old_mission','cemetery_chapel','st_brigid'];
  const ROLES=['loyal','gossip','fedup'];
  const GOTH_ACTS=['rite','moon','where','criticize','sisters'];
  const VICTORIA_ACTS=['rite','flyers','where','come','backout','confront'];
  const QUEST_CHANCE=0.5; // share of runs in which the Chapel at Midnight happens
  const FATAL=['confront','reported','went_alone','remembered','betrayed'];
  const OUTCOMES=['stopped','reconciled','wrong_place','ignored'];
  const STOPPED=['stopped','reconciled'];
  const CLUE_KINDS=['flyer','chalk','riddle','never','victoria','moon','host'];
  const PLACE_CLUES=['chalk','riddle','never','victoria']; // the clues that point at a chapel
  const OLD_OPENINGS=['I saw you looking at my flyer. ☾ You should come to the show. Come alone.'];
  // Milliseconds from the start of the attack: crescent premonition, then
  // the three room frames, the blackout and finally the death screen.
  const ATTACK={frames:[1500,2450,3400],devour:4000,death:4900};
  const STYLE=`
    .chapel-attack{display:none;position:absolute;z-index:19;inset:0;background:#05040a;overflow:hidden;pointer-events:none}
    .chapel-attack.visible{display:block}
    .chapel-attack img{width:100%;height:100%;object-fit:cover;image-rendering:pixelated}
    .chapel-attack p{position:absolute;left:8%;right:8%;bottom:9%;margin:0;padding:9px;text-align:center;color:#f2dcff;background:#0b0610d9;border:1px solid #8c6aa6;font:bold 13px/1.4 'Trebuchet MS',Tahoma,sans-serif;letter-spacing:.06em}
    .chapel-attack p:empty{display:none}
    .chapel-attack.jolt img{animation:chapelJolt 270ms steps(4,end) both}
    .chapel-attack.devouring img{animation:chapelDevour 600ms steps(4,end) forwards}
    @keyframes chapelJolt{0%,100%{transform:none;filter:brightness(1)}25%{transform:translateX(4px);filter:brightness(1.25)}50%{transform:translateX(-4px);filter:brightness(.6)}75%{transform:translateY(-5px)}}
    @keyframes chapelDevour{0%{transform:scale(1);filter:brightness(1)}45%{transform:scale(1.12);filter:brightness(.6) hue-rotate(-20deg)}85%,100%{transform:scale(1.3);filter:brightness(0)}}
    .hinge-options{max-height:56%;overflow-y:auto}
    .hinge-chat-choice.chapel-choice{color:#4b2d63;background:#f6efff;border-color:#b79bd3}
    .hinge-chat-choice.chapel-entry{color:#f5ecff;background:#3b2a52;border-color:#8f74b3}
    .chapel-case h3{margin-top:4px}
    .chapel-case h4{margin:14px 0 5px;font:bold 11px -apple-system,Arial,sans-serif;text-transform:uppercase;letter-spacing:.07em;color:#7b4f9c}
    .chapel-case p,.chapel-case li{font-size:calc(11px * var(--reading-scale));line-height:1.45;margin:4px 0;color:#333b48}
    .chapel-case ul{margin:3px 0;padding-left:15px}
    .chapel-case .chapel-status{padding:7px;border:1px solid #c7b1dc;border-radius:5px;background:#f8f2ff;color:#3b2752}
    .chapel-case .chapel-hint{padding:5px 7px;border-left:3px solid #8f74b3;background:#f4edfb;color:#3b2752;font-style:italic}
    .chapel-row{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}
    .chapel-btn{cursor:pointer;border:1px solid #a996bd;border-radius:4px;background:#fff;color:#3b2c4c;padding:5px 6px;font:bold calc(10px * var(--reading-scale)) -apple-system,Arial,sans-serif}
    .chapel-btn.on{background:#4b3466;color:#fff;border-color:#4b3466}
    .chapel-person{border-top:1px dashed #d8c9e6;padding:5px 0}
    .chapel-person small{display:block;color:#6b6075;font-size:calc(10px * var(--reading-scale))}
    .chapel-back{margin-bottom:4px}
    .chapel-win{display:none;position:absolute;z-index:31;inset:0;overflow:hidden;background:#0b0714;color:#f3e9ff;text-align:center}
    .chapel-win.visible{display:block;animation:chapelWinIn 1.6s ease-out both}
    .chapel-win .backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;opacity:.6}
    .chapel-win .veil{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,#c9a7ff2e 0,#1a0f2e99 55%,#07040eee 100%)}
    .chapel-win .card{position:absolute;left:7%;right:7%;top:9%;bottom:7%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
    .chapel-win .frame{width:64%;aspect-ratio:3/4;border:5px solid #b89ad8;border-radius:6px;box-shadow:0 0 0 3px #3b2752,0 10px 30px #000c;background:#1a1026;overflow:hidden}
    .chapel-win .frame img{width:100%;height:100%;object-fit:cover;image-rendering:pixelated}
    .chapel-win h2{margin:6px 0 0;font:900 30px/1 'Trebuchet MS',Tahoma,sans-serif;letter-spacing:.12em;color:#e6d4ff;text-shadow:0 3px 0 #3b2752,0 0 18px #b89ad888}
    .chapel-win .sub{margin:0;font:italic bold 16px/1.3 Georgia,serif;color:#f6efff}
    .chapel-win .line{margin:0;font:bold 12px/1.4 'Trebuchet MS',Tahoma,sans-serif;letter-spacing:.06em;color:#d9c7f0}
    .chapel-win button{margin-top:6px;min-height:40px;padding:8px 18px;font:bold 13px 'Trebuchet MS',Tahoma,sans-serif;color:#1a1026;background:#e6d4ff;border:2px solid #fff;border-radius:5px;cursor:pointer}
    @keyframes chapelWinIn{from{opacity:0}to{opacity:1}}
    @media (prefers-reduced-motion: reduce){.chapel-attack.jolt img,.chapel-attack.devouring img{animation:none}}
  `;

  function attackFrame(phase,stage){
    return `assets/events/goth-${LIGHTING[phase]||'night'}-${STAGES[stage]}.webp`;
  }
  // Quest randomness is derived from the run seed, so it never disturbs the
  // game's own random sequence and is identical after Save/Load.
  function seeded(text){
    let hash=2166136261;
    for(const char of String(text)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
    let x=(hash>>>0)||1;
    return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};
  }

  function create(api){
    let data=root.MATCH_CHAPEL_DATA||null;
    let caseOpen=false,attackTimers=[];
    let overlay=null,overlayImage=null,overlayCaption=null,fatalBackground=null,win=null;
    const questMode=new Set();
    if(!data&&typeof root.fetch==='function'){
      // The linked-asset preview.html loads the JSON; the standalone build inlines it.
      const stamp=root.document?.documentElement?.getAttribute?.('data-build'); // online editions: this build's version
      root.fetch('chapel_at_midnight.json'+(stamp?`?v=${stamp}`:'')).then(response=>response.json()).then(json=>{data=json;}).catch(()=>{});
    }

    // ---------- state ----------
    function freshState(world){
      const seed=world.seed||'match';
      const rnd=seeded(`${seed}:chapel`);
      const location=PLACES[Math.floor(rnd()*PLACES.length)];
      const wrong=PLACES.filter(place=>place!==location);
      const chalkOther=wrong[Math.floor(rnd()*wrong.length)];
      const order=[...ROLES];
      for(let i=order.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      // Victoria's scheme doesn't happen every run: decided once, from the run's seed.
      // Whether Victoria's scheme is in this run: the game's quest roster decides (one or two
      // quests a run); without one, a coin toss from the run's seed.
      const enabled=api.questDay?api.questDay()!==null:seeded(`${seed}:chapel:on`)()<(data.rules.chance??QUEST_CHANCE);
      return {
        v:2,enabled,active:false,startDay:null,riteDay:null,startedBy:null,
        location,chalkOther,chalkTrueFirst:rnd()<.5,
        roles:Object.fromEntries(FLYER_GOTHS.map((id,i)=>[id,order[i]])),
        heat:0,whispers:0,
        attackDueDay:null,attackReason:null,attackPending:false,attackRunning:false,attackPhase:null,dead:false,death:null,deathKind:null,
        nightKnown:false, // which night is the moonless one: someone has to tell you
        hostKnown:false, // that the rite is Victoria's: someone has to tell you that too
        clockDay:null, // the day you matched with Victoria: her seven nights count from it
        countdownFrom:null,countdownEve:false, // the goth who texts you the countdown
        dateFrom:null,dateOffered:false,won:false,wonDay:null, // after the Sisters stop her: the goth who asks you out
        clues:[],goths:{},numbers:{},victoria:{asked:[],told:false,going:false,whereDay:null},
        warned:null,warnedDay:null,fedupJoins:false,fedupId:null,
        outcome:null,outcomeDay:null,ritualCompleted:false,resultText:null,notice:null,journal:[]
      };
    }
    function state(){
      if(!data)return null;
      const world=api.world();
      if(!world)return null;
      if(!world.chapel||world.chapel.v!==2)world.chapel=freshState(world);
      return world.chapel;
    }
    // Saved games are untrusted input: keep only known keys of the right type.
    // Saves from the old, longer quest (v1) start this one fresh.
    function normalize(raw,world){
      const base=freshState(world);
      if(!raw||typeof raw!=='object'||raw.v!==2)return base;
      const out={...base};
      const int=value=>Number.isInteger(value)?value:null;
      const isId=value=>typeof value==='string'&&/^MATCH-\d{3}$/.test(value);
      for(const key of ['active','dead','attackPending','attackRunning','ritualCompleted','chalkTrueFirst','fedupJoins','hostKnown','countdownEve','dateOffered','won'])out[key]=!!raw[key];
      if(raw.hostKnown===undefined)out.hostKnown=!!raw.active; // a case open from before this: its file already named her
      out.nightKnown=raw.nightKnown===undefined?!!raw.active:!!raw.nightKnown; // a case already open from before kept its countdown
      for(const key of ['startDay','riteDay','attackDueDay','outcomeDay','warnedDay','clockDay','wonDay'])out[key]=int(raw[key]);
      for(const key of ['heat','whispers'])out[key]=Math.max(0,Math.min(99,int(raw[key])||0));
      if(typeof raw.enabled==='boolean')out.enabled=raw.enabled;
      if(out.active)out.enabled=true; // a case already open carries on
      if(out.active&&(out.startDay===null||out.riteDay===null)){out.active=false;out.startDay=null;out.riteDay=null;}
      out.startedBy=['match','flyer','workbench'].includes(raw.startedBy)?raw.startedBy:null;
      if(PLACES.includes(raw.location))out.location=raw.location;
      out.chalkOther=PLACES.includes(raw.chalkOther)&&raw.chalkOther!==out.location?raw.chalkOther:PLACES.find(place=>place!==out.location);
      if(raw.roles&&FLYER_GOTHS.every(id=>ROLES.includes(raw.roles[id]))&&new Set(FLYER_GOTHS.map(id=>raw.roles[id])).size===3)out.roles={...raw.roles};
      out.attackReason=FATAL.includes(raw.attackReason)?raw.attackReason:null;
      out.death=FATAL.includes(raw.death)?raw.death:null;
      out.deathKind=['chapel-ritual','chapel-victoria'].includes(raw.deathKind)?raw.deathKind:null;
      out.attackPhase=LIGHTING[raw.attackPhase]?raw.attackPhase:null;
      out.outcome=OUTCOMES.includes(raw.outcome)?raw.outcome:null;
      out.warned=PLACES.includes(raw.warned)?raw.warned:null;
      out.fedupId=isId(raw.fedupId)?raw.fedupId:null;
      out.countdownFrom=isId(raw.countdownFrom)?raw.countdownFrom:null;
      out.dateFrom=isId(raw.dateFrom)?raw.dateFrom:null;
      if(!out.dateFrom){out.dateOffered=false;out.won=false;out.wonDay=null;}
      out.resultText=typeof raw.resultText==='string'?raw.resultText.slice(0,500):null;
      out.clues=Array.isArray(raw.clues)?raw.clues.filter(c=>c&&CLUE_KINDS.includes(c.kind)&&Number.isInteger(c.day)&&typeof c.text==='string')
        .map(c=>({kind:c.kind,day:c.day,text:c.text.slice(0,300),...(isId(c.source)?{source:c.source}:{})})).slice(0,20):[];
      out.goths={};
      if(raw.goths&&typeof raw.goths==='object')for(const [id,g] of Object.entries(raw.goths).slice(0,40)){
        if(!isId(id)||id===VICTORIA||!g||typeof g!=='object')continue;
        out.goths[id]={asked:Array.isArray(g.asked)?[...new Set(g.asked.filter(act=>GOTH_ACTS.includes(act)))]:[],opened:!!g.opened,told:!!g.told,whereDay:int(g.whereDay),named:!!g.named,rang:!!g.rang};
      }
      out.numbers={};
      if(raw.numbers&&typeof raw.numbers==='object')for(const id of FLYER_NUMBERS)if(/^\d{7}$/.test(String(raw.numbers[id]||'')))out.numbers[id]=String(raw.numbers[id]);
      const v=raw.victoria||{};
      out.victoria={asked:Array.isArray(v.asked)?[...new Set(v.asked.filter(act=>VICTORIA_ACTS.includes(act)))]:[],told:!!v.told,going:!!v.going,whereDay:int(v.whereDay)};
      out.journal=Array.isArray(raw.journal)?raw.journal.filter(j=>j&&Number.isInteger(j.day)&&typeof j.text==='string').slice(-40):[];
      return out;
    }

    // ---------- helpers ----------
    const rules=()=>data.rules;
    const startDay=()=>api.questDay?.()??rules().activationDay; // the first day her flyer can appear
    const today=()=>api.world().day;
    const nameOf=id=>api.profile(id)?.name||'someone';
    const firstName=id=>nameOf(id).split(' ')[0];
    const esc=value=>api.esc(value);
    const placeName=key=>data.places[key]?.name||'an unknown place';
    const placeShort=key=>data.places[key]?.short||'unknown';
    const threadOf=id=>api.threads().get(id)||null;
    const isClosed=id=>{const thread=threadOf(id);return !!(thread&&(thread.blocked||thread.fumbled));};
    const cap=text=>text.charAt(0).toUpperCase()+text.slice(1);
    const holder=(st,role)=>FLYER_GOTHS.find(id=>st.roles[id]===role);
    const isGoth=profile=>!!profile&&profile.factionId==='goth_girls'&&profile.id!==VICTORIA;
    const isSister=profile=>!!profile&&profile.factionId==='sisters_of_mercy';
    const warmth=id=>{const thread=threadOf(id);if(api.warmth)return api.warmth(id);return Number.isFinite(thread?.warmth)?thread.warmth:0;};
    function relNights(target){
      const n=target-today();
      if(n<0)return 'already over';
      if(n===0)return 'tonight';
      if(n===1)return 'tomorrow night';
      return `in ${n} nights`;
    }
    function fill(text,extra={}){
      const st=state();
      const chalk=st.chalkTrueFirst?[st.location,st.chalkOther]:[st.chalkOther,st.location];
      const vars={place:placeName(st.location),Place:cap(placeName(st.location)),PLACE:placeName(st.location).toUpperCase(),
        rite:st.hostKnown?'Victoria Blackwood’s rite':'the Midnight Rite',Rite:st.hostKnown?'Victoria Blackwood’s rite':'The Midnight Rite',
        short:placeShort(st.location),chalkA:placeName(chalk[0]),chalkB:placeName(chalk[1]),
        warnedPlace:placeName(st.warned),riddle:data.places[st.location].riddle,
        fedup:nameOf(st.fedupId||holder(st,'fedup')),gossip:nameOf(holder(st,'gossip')),
        djNumber:flyerNumber(st,FLYER_NUMBERS[0]),shopNumber:flyerNumber(st,FLYER_NUMBERS[1]),
        when:st.riteDay===null?'soon':st.nightKnown?relNights(st.riteDay):'on the moonless night',night:st.riteDay===null?'soon':relNights(st.riteDay),Night:cap(st.riteDay===null?'soon':relNights(st.riteDay)),...extra};
      return String(text).replace(/\{(\w+)\}/g,(match,key)=>vars[key]!==undefined?String(vars[key]):match);
    }
    // The numbers printed on the flyer, made once per run (the game hands out unused ones).
    function flyerNumber(st,id){
      if(!st.numbers)st.numbers={};
      if(!st.numbers[id]){
        const made=api.newNumber?String(api.newNumber()):'';
        st.numbers[id]=/^\d{7}$/.test(made)?made:String(5550100+Math.floor(seeded(`${api.world().seed}:flyer:${id}`)()*9800));
      }
      return st.numbers[id];
    }
    const flyerRead=st=>st.clues.some(c=>c.kind==='flyer'); // you've seen the flyer in the paper
    // What you know about a woman: her number (from the flyer, or she gave it you), whether you've
    // matched on Hinge, and her name (a match shows it; so does ringing her).
    function knowsNumber(st,id){return (FLYER_NUMBERS.includes(id)&&flyerRead(st))||!!threadOf(id)?.number;}
    function knowsName(st,id){return id===VICTORIA||!!threadOf(id)||!!st.goths[id]?.named;}
    const placeClue=st=>st.clues.some(c=>PLACE_CLUES.includes(c.kind)); // something points at a chapel
    const ready=st=>st.nightKnown&&placeClue(st); // the Sisters need both: which night, and a chapel to name
    // A number between 0 and 1 for one chancy moment, fixed by the run's seed.
    function chance(st,key){return seeded(`${api.world().seed}:${key}:${today()}:${st.whispers}:${st.heat}`)();}
    function journal(st,text){
      st.journal.push({day:today(),text});
      if(st.journal.length>40)st.journal.splice(0,st.journal.length-40);
    }
    function addClue(st,kind,text,source=null){
      if(st.clues.some(c=>c.kind===kind&&(c.source||null)===source))return false;
      st.clues.push({kind,day:today(),text,...(source?{source}:{})});
      api.recordClue(text);
      if(PLACE_CLUES.includes(kind))syncTopics(st);
      return true;
    }
    function deliver(id,text){
      const thread=threadOf(id);
      if(!thread||thread.blocked||thread.fumbled)return false;
      thread.awaiting=false;thread.ghosted=false;thread.replyOnDay=null;
      thread.log.push({who:'her',text});
      return true;
    }
    function refresh(){if(caseOpen)renderCase();else api.rerender();}
    // Shows the player's line, a typing bubble, then her reply.
    function converse(id,playerText,replyText,after){
      const thread=threadOf(id),profile=api.profile(id);
      if(!thread||!profile||thread.pending)return false;
      const seed=api.world().seed;
      thread.log.push({who:'you',text:playerText});
      thread.pending=true;
      refresh();
      api.later(()=>{
        thread.pending=false;
        if(api.world().seed!==seed)return; // a new run started meanwhile
        if(replyText)thread.log.push({who:'her',text:replyText});
        const st=state();
        if(st&&after)after(st,thread);
        refresh();
      },api.replyDelay(profile,'chapel'));
      return true;
    }

    // ---------- what Victoria hears ----------
    // Heat is how much Victoria has heard about you. Nothing on screen shows it.
    function raiseHeat(st,amount){
      if(!amount||st.outcome)return;
      st.heat+=amount;
      if(st.heat>=rules().heatToAttack&&st.attackDueDay===null){
        st.attackDueDay=today()+1+(chance(st,'night')<.5?0:1); // one night or two: you never know which
        st.attackReason='reported';
      }
    }
    // The scene is small: every question about the rite is talked about somewhere.
    function whisper(st){
      st.whispers++;
      if(rules().whisperSteps.includes(st.whispers))raiseHeat(st,1);
    }

    // ---------- starting the case ----------
    // The case opens when you see the flyer. The seven nights count from the day you matched with
    // Victoria, if you did that first (never fewer than two nights away: the paper has to catch up).
    function start(st,how){
      if(!st||st.active||st.enabled===false||st.dead)return false;
      st.active=true;st.startDay=today();st.startedBy=how;
      st.riteDay=Math.max((st.clockDay??today())+rules().riteAfterDays,today()+2);
      syncTopics(st);
      const edition=(api.world().editions||[]).find(item=>item.day===today());
      if(edition)decorateEdition(edition);
      journal(st,'A Midnight Rite flyer is in the paper: one night only, on the next moonless night. The host signs only as V.B.');
      api.status('☾ A new case file is in your bedside cupboard: the Chapel at Midnight.');
      return true;
    }
    // Hinge calls this after every match. Matching with Victoria starts her clock, but nothing is
    // said about any rite until you see the flyer. After the Sisters stop her, matching with the
    // goth who likes you gets her message.
    function onMatch(id){
      const st=state();
      if(!st)return false;
      if(id===VICTORIA){
        if(st.active||st.enabled===false||st.dead||st.clockDay!==null)return false;
        st.clockDay=today();
        return true;
      }
      if(st.dateFrom===id&&!st.dateOffered&&!st.dead)offerDate(st);
      return false;
    }
    // preview.html calls this when the player opens the News app.
    function onPaperOpened(){
      const st=state();
      if(!st)return;
      if(!st.active&&st.enabled!==false&&!st.dead&&today()>=startDay())start(st,'flyer');
      if(st.active)syncNews(st,true);
    }
    function syncNews(st,openedToday=false){
      const world=api.world(),seen=world.seenArticles||[];
      for(const edition of world.editions||[]){
        for(const item of edition.items||[]){
          if(!item.chapelFragment)continue;
          if(!seen.includes(`${edition.day}:${item.id}`)&&!(openedToday&&edition.day===today()))continue;
          if(item.chapelFragment==='flyer')addClue(st,'flyer',`Paper, day ${edition.day}: the Midnight Rite is one night only, on the next moonless night. Venue by word of mouth only.`);
          if(item.chapelFragment==='chalk')addClue(st,'chalk',`Paper, day ${edition.day}: ${fill(data.chalkPlaces)}`);
        }
      }
    }
    function sync(){
      const st=state();
      if(!st)return null;
      // A match made before this engine knew about it (an old save, say) still counts.
      if(!st.active&&st.enabled!==false&&!st.dead&&st.clockDay===null&&threadOf(VICTORIA))st.clockDay=today();
      if(st.active)syncNews(st);
      return st;
    }
    function ensureServiceTopics(on){
      const list=api.serviceTopics?.['service:chapel'];
      if(!list||!data)return;
      for(let i=list.length-1;i>=0;i--)if(String(list[i].id).startsWith('chapel_'))list.splice(i,1);
      if(!on)return;
      for(const place of PLACES)list.push({id:`chapel_warn_${place}`,label:fill(data.sisterTalk.callLabel,{short:placeShort(place)}),
        reply:fill(data.sisterTalk.callReply,{place:placeName(place)}),onChoose:()=>{const st=state();if(st&&canReachSisters(st,true))warn(st,place);}});
    }
    // St. Brigid's line takes a warning only once you have both halves: which night, and a chapel to name.
    function syncTopics(st){ensureServiceTopics(!!st&&st.active&&!st.outcome&&!st.dead&&ready(st));}

    // ---------- the goth crowd ----------
    // The three girls on the flyer are one of each: loyal to Victoria, a gossip, and
    // fed up with her. Any other goth you match with is one of the three too.
    function roleOf(st,id){
      if(st.roles[id])return st.roles[id];
      const weights=rules().otherGothRoles,roll=seeded(`${api.world().seed}:goth:${id}`)();
      return roll<weights.loyal?'loyal':roll<weights.loyal+weights.gossip?'gossip':'fedup';
    }
    function gothState(st,id){return st.goths[id]||(st.goths[id]={asked:[],opened:false,told:false,whereDay:null,named:false,rang:false});}
    function isFriend(st,id){
      const g=gothState(st,id);
      return warmth(id)>=(roleOf(st,id)==='fedup'&&g.opened?1:rules().friendWarmth);
    }
    // The wrong chapel a gossip rules out. The flyer gossip rules out the chapel the paper
    // got wrong, so her word and the chalk story together give the answer.
    function neverPlace(st,id){
      if(FLYER_GOTHS.includes(id))return st.chalkOther;
      const wrong=PLACES.filter(place=>place!==st.location);
      return wrong[Math.floor(seeded(`${api.world().seed}:never:${id}`)()*wrong.length)];
    }
    function gothChoices(st,id){
      const g=gothState(st,id);
      return GOTH_ACTS.filter(act=>{
        if(act==='moon')return !st.nightKnown&&!g.asked.includes('moon'); // until somebody has told you which night
        if(act!=='rite'&&!st.hostKnown)return false; // until somebody has told you whose rite it is
        if(act==='where')return !g.told&&g.whereDay!==today();
        if(act==='sisters'&&!st.warned)return false;
        return !g.asked.includes(act);
      });
    }
    function gothAct(st,id,act){
      const profile=api.profile(id);
      if(!isGoth(profile)||isClosed(id)||st.outcome||!gothChoices(st,id).includes(act))return;
      const role=roleOf(st,id),g=gothState(st,id),lines=data.gothRoles[role];
      let reply=lines[act],after=null;
      const asks=data.gothActions[act];
      const playerLine=act==='rite'&&!st.hostKnown?asks.playerUnknown:act==='where'&&!flyerRead(st)?asks.playerNoFlyer:asks.player;
      if(act==='rite'){
        g.asked.push('rite');
        after=st=>learnHost(st,firstName(id)); // every one of them says whose night it is
      }else if(act==='moon'){
        g.asked.push('moon');
        reply=data.moon.goth[role]||data.moon.goth.other;
        after=st=>{learnNight(st,firstName(id));if(role==='loyal')learnHost(st,firstName(id));}; // the loyal one names her
      }else if(act==='where'){
        g.whereDay=today();
        const friend=isFriend(st,id);
        if(role==='loyal'){
          reply=friend?lines.whereFriend:lines.whereStranger;
          after=st=>{whisper(st);if(!friend||chance(st,`loyal:${id}`)<rules().loyalFriendReportChance)raiseHeat(st,1);};
        }else if(!friend){
          reply=lines.whereStranger;
          after=st=>whisper(st);
        }else if(role==='gossip'){
          const not=neverPlace(st,id);
          g.told=true;
          reply=fill(lines.whereFriend,{notPlace:placeName(not),never:data.places[not].never});
          after=st=>{whisper(st);addClue(st,'never',`${firstName(id)} says it’s not ${placeName(not)}. ${data.places[not].never}`,id);};
        }else{
          g.told=true;
          reply=fill(lines.whereFriend);
          after=st=>{whisper(st);addClue(st,'riddle',`${firstName(id)} says Victoria only ever calls it the place ${data.places[st.location].riddle}.`,id);};
        }
      }else{
        g.asked.push(act);
        if(act==='criticize')after=st=>{
          whisper(st);
          if(role==='loyal')raiseHeat(st,2);
          else if(role==='gossip'){if(chance(st,`gossip:${id}`)<rules().gossipReportChance)raiseHeat(st,1);}
          else{gothState(st,id).opened=true;api.warmBy?.(id,1);}
        };
        if(act==='sisters')after=st=>{
          if(role==='loyal')raiseHeat(st,2);
          else if(role==='gossip')raiseHeat(st,1);
          else{st.fedupJoins=true;st.fedupId=id;journal(st,`${nameOf(id)} will stand with the Sisters on the night.`);}
        };
      }
      converse(id,playerLine,fill(reply),after);
    }

    // ---------- Victoria (only once you've matched) ----------
    function victoriaChoices(st){
      const v=st.victoria,out=[];
      if(!st.hostKnown)return ['flyers']; // all you can ask her yet: whether the crescent flyers are hers
      if(!v.asked.includes('rite'))out.push('rite');
      if(!st.nightKnown)out.push('when'); // which night
      if(!v.told&&v.whereDay!==today())out.push('where');
      out.push(v.going?'backout':'come');
      out.push('confront');
      return out;
    }
    function victoriaAct(st,act){
      if(!threadOf(VICTORIA)||isClosed(VICTORIA)||st.outcome||!victoriaChoices(st).includes(act))return;
      const line=data.victoria.actions[act];
      let reply=line.reply,after=null;
      if(act==='rite')st.victoria.asked.push('rite');
      if(act==='flyers'){st.victoria.asked.push('rite');after=st=>learnHost(st,'Victoria');} // she tells you herself: the same answer as asking about her rite
      if(act==='when')after=st=>learnNight(st,'Victoria');
      if(act==='where'){
        st.victoria.whereDay=today();
        const trusted=warmth(VICTORIA)>=rules().victoriaWarmth;
        reply=fill(trusted?line.friend:line.stranger);
        after=st=>{
          whisper(st);
          if(trusted){st.victoria.told=true;addClue(st,'victoria',`Victoria told you herself: ${placeName(st.location)}. Come alone, she said.`);}
          else if(chance(st,'victoria-ask')<rules().victoriaAskReportChance)raiseHeat(st,1);
        };
      }
      if(act==='come')after=st=>{st.victoria.going=true;journal(st,'You told Victoria you would come to her rite, alone.');};
      if(act==='backout')after=st=>{st.victoria.going=false;raiseHeat(st,1);journal(st,'You told Victoria you are not coming after all.');};
      if(act==='confront')after=(st,thread)=>{
        thread.fumbled=true;
        if(st.attackDueDay===null||st.attackDueDay>today()+1){st.attackDueDay=today()+1;st.attackReason='confront';}
        journal(st,'You told Victoria you know what she is planning.');
      };
      converse(VICTORIA,line.player,fill(reply),after); // her lines can name the night ({night}, {Night})
    }

    // Someone tells you which night the moon goes dark: now the case file can count down.
    function learnNight(st,who){
      if(st.nightKnown)return;
      st.nightKnown=true;
      addClue(st,'moon',fill(data.moon.clue,{who}));
      syncTopics(st);
    }
    // Someone tells you whose rite it is. Until then the case file knows only the initials on the flyer.
    function learnHost(st,who){
      if(st.hostKnown)return;
      st.hostKnown=true;
      addClue(st,'host',who==='Victoria'?data.host.herself:fill(data.host.clue,{who}));
    }
    function sisterMoon(st,id){
      if(!isSister(api.profile(id))||isClosed(id)||st.outcome||st.nightKnown)return;
      converse(id,data.moon.sister.player,fill(data.moon.sister.reply),st=>learnNight(st,firstName(id)));
    }
    // ---------- the Sisters of Mercy ----------
    function sisterThreads(){
      return [...api.threads().values()].filter(thread=>isSister(api.profile(thread.id))&&!thread.blocked&&!thread.fumbled);
    }
    // You can send word once you know St Brigid's number or have a Sister to tell.
    function canReachSisters(st,onCall=false){return onCall||!!api.serviceKnown?.('chapel')||sisterThreads().length>0;}
    function warn(st,place){
      if(!PLACES.includes(place)||!st.active||st.outcome||!ready(st))return false;
      const changed=!!st.warned&&st.warned!==place;
      if(st.warned===place)return true;
      st.warned=place;st.warnedDay=today();
      journal(st,changed?`You sent word again: the Sisters will keep watch at ${placeName(place)} instead.`:
        `You sent word: the Sisters will keep watch at ${placeName(place)} on the night of the rite.`);
      return true;
    }
    function sisterAct(st,id,place){
      if(!isSister(api.profile(id))||isClosed(id)||st.outcome||!PLACES.includes(place))return;
      const talk=data.sisterTalk,changed=!!st.warned&&st.warned!==place;
      const vars={place:placeName(place),Place:cap(placeName(place)),short:placeShort(place)};
      converse(id,fill(talk.player,vars),fill(changed?talk.changed:talk.reply,vars),st=>warn(st,place));
    }

    // ---------- the night of the rite ----------
    function resolveRite(st){
      const stopped=st.warned===st.location;
      const fedupStands=st.fedupJoins&&!!st.fedupId&&!isClosed(st.fedupId);
      const outcome=stopped?(fedupStands?'reconciled':'stopped'):st.warned?'wrong_place':'ignored';
      const completed=!stopped;
      // The rite went ahead: she may come for you. Stopped: the police take her at the chapel door.
      let fatal=null;
      if(st.victoria.going&&completed)fatal='went_alone';
      else if(completed&&st.heat>=1)fatal='remembered';
      st.outcome=outcome;st.outcomeDay=today();st.ritualCompleted=completed;
      st.resultText=fill(data.outcomes[outcome]);
      api.recordClue(st.resultText);journal(st,st.resultText);
      ensureServiceTopics(false);
      if(stopped&&st.fedupId)deliver(st.fedupId,data.messages.fedupAfter);
      if(completed)deliver(VICTORIA,data.victoria.afterCompleted);
      else{
        st.hostKnown=true; // the paper names her
        const victoria=threadOf(VICTORIA);
        if(victoria){victoria.fumbled=true;victoria.awaiting=false;victoria.ghosted=false;} // in custody: her chat is over
        if(!st.attackRunning){st.attackDueDay=null;st.attackReason=null;st.attackPending=false;} // whatever she had planned for you, she's not coming
        chooseDate(st);
      }
      const gossip=holder(st,'gossip');
      if(completed&&gossip&&threadOf(gossip)){
        const thread=threadOf(gossip);thread.ghosted=true;thread.awaiting=true;thread.missing=true;
        journal(st,fill(data.messages.gossipMissing));
      }
      if(fatal&&(st.attackDueDay===null||st.attackDueDay>today())){st.attackDueDay=today();st.attackReason=fatal;}
      st.notice=completed?'☾ Something happened in the night. Read today’s paper.':'✝ The Sisters kept watch all night. Read today’s paper.';
    }

    // ---------- after the Sisters stop her: a date ----------
    // One of the goth crowd liked how you handled it: the girl who stood with the Sisters first, else
    // the goth you know best, else the fed-up girl from the flyer, who turns up in your deck.
    function chooseDate(st){
      const order={fedup:0,gossip:1,loyal:2};
      const known=[...api.threads().values()].filter(thread=>isGoth(api.profile(thread.id))&&!isClosed(thread.id)&&!thread.missing)
        .sort((a,b)=>(a.id===st.fedupId?-1:b.id===st.fedupId?1:0)||order[roleOf(st,a.id)]-order[roleOf(st,b.id)]||warmth(b.id)-warmth(a.id));
      st.dateFrom=known[0]?.id||holder(st,'fedup');
      if(threadOf(st.dateFrom))offerDate(st);
      else if(api.toDeck)api.toDeck(st.dateFrom);
    }
    function offerDate(st){
      if(!st.dateFrom||st.dateOffered||!deliver(st.dateFrom,data.date.offer))return;
      st.dateOffered=true;
      journal(st,fill(data.date.journal,{name:nameOf(st.dateFrom)}));
    }
    function dateChoices(st,id){return st.dateOffered&&!st.won&&id===st.dateFrom?['yes','stay']:[];}
    function dateAct(st,id,act){
      if(!dateChoices(st,id).includes(act)||isClosed(id))return;
      const line=data.date.actions[act];
      converse(id,line.player,fill(line.reply,{name:firstName(id)}),act==='yes'?st=>winDate(st,id):null);
    }
    // The win: the only date in the game that ever happens.
    function winDate(st,id){
      if(st.won)return;
      st.won=true;st.wonDay=today();
      api.world().victory={type:'date',bride:id,day:today()};
      journal(st,fill(data.date.won,{name:nameOf(id)}));
      api.status(fill(data.date.status,{name:nameOf(id)}));
      api.save?.();
      showWin(st);
    }
    // Which night: the goth crowd counts down to it, and a girl you've matched with may text you the
    // number. The night before, she texts again.
    function countdown(st){
      if(st.outcome||st.riteDay===null)return;
      const left=st.riteDay-today();
      if(left<1)return;
      const goths=[...api.threads().values()].filter(thread=>isGoth(api.profile(thread.id))&&!isClosed(thread.id)&&!thread.missing);
      if(!st.nightKnown){
        if(!goths.length||chance(st,'countdown')>=rules().countdownChance)return;
        const order={gossip:0,fedup:1,loyal:2};
        goths.sort((a,b)=>order[roleOf(st,a.id)]-order[roleOf(st,b.id)]||warmth(b.id)-warmth(a.id));
        const id=goths[0].id;
        if(!deliver(id,fill(data.countdown.first)))return;
        st.countdownFrom=id;
        learnNight(st,firstName(id));
      }else if(left===1&&st.countdownFrom&&!st.countdownEve&&deliver(st.countdownFrom,fill(data.countdown.eve)))st.countdownEve=true;
    }

    // ---------- day hooks ----------
    // Called once per "Start another day", after world.day has advanced and
    // before the new newspaper is printed.
    function onNewDay(){
      const st=state();
      if(!st||st.dead||!st.active)return;
      sync();
      if(!st.outcome&&today()>st.riteDay)resolveRite(st);
      else if(!st.outcome)countdown(st);
      if(!st.attackPending&&st.attackDueDay!==null&&today()>=st.attackDueDay)st.attackPending=true;
    }
    // Called after the day transition finishes. Returns true when Victoria's
    // attack has taken over the room.
    function afterDayStart(){
      const st=state();
      if(!st)return false;
      if(st.notice){api.status(st.notice);st.notice=null;}
      if(st.attackPending&&!st.dead){startAttack(st.attackReason);return true;}
      return false;
    }

    // ---------- news ----------
    function story(template,fragment,extra={}){
      const item={id:template.id,section:template.section,title:fill(template.title,extra),summary:fill(template.summary,extra),body:fill(template.body,extra),questStory:true};
      if(template.clue)item.clue=fill(template.clue,extra);
      if(fragment)item.chapelFragment=fragment;
      return item;
    }
    function outcomeVars(st){
      const gossip=holder(st,'gossip');
      const missing=gossip&&threadOf(gossip)?data.news.outcomes.missingGoth:data.news.outcomes.missingStranger;
      return {vigilNote:st.outcome==='wrong_place'?fill(data.news.outcomes.vigilElsewhere):'',missingBody:fill(missing)};
    }
    function storyFor(st,day){
      if(!st.active){
        // Until the case starts, the flyer runs in the paper every day from day two.
        return st.enabled!==false&&!st.dead&&day>=startDay()?story(data.news.flyer,'flyer'):null;
      }
      if(st.outcome&&day>=st.outcomeDay){
        const key=st.outcome==='reconciled'?'reconciled':st.outcome==='stopped'?'stopped':'completed';
        const template=data.news.outcomes[key][day-st.outcomeDay];
        return template?story(template,null,outcomeVars(st)):null;
      }
      const offset=day-st.startDay;
      if(offset===0)return story(data.news.flyer,'flyer');
      if(offset===2)return story(data.news.chalk,'chalk');
      if(day===st.riteDay-2)return story(data.news.reminder,'reminder');
      return null;
    }
    // The quest story takes the third (local filler) tile unless another quest
    // already uses it, in which case it is added as a fourth tile.
    function decorateEdition(edition){
      const st=state();
      if(!st||!edition||!Array.isArray(edition.items))return edition;
      if(edition.items.some(item=>item.questStory&&(item.chapelFragment||item.chapelOutcome)))return edition;
      const item=storyFor(st,edition.day);
      if(!item)return edition;
      if(!item.chapelFragment)item.chapelOutcome=true;
      if(edition.items.length>2&&!edition.items[2].questStory)edition.items[2]=item;
      else edition.items.push(item);
      return edition;
    }

    // ---------- Victoria's attack ----------
    function mount(){
      const doc=api.document;
      if(!doc)return;
      if(!doc.getElementById('chapel-style')&&doc.createElement){
        const style=doc.createElement('style');
        style.id='chapel-style';style.textContent=STYLE;
        (doc.head||doc.body).appendChild(style);
      }
      if(overlay)return;
      overlay=doc.getElementById('chapel-attack');
      if(!overlay&&doc.createElement){
        overlay=doc.createElement('div');
        overlay.id='chapel-attack';overlay.className='chapel-attack';
        overlay.setAttribute('role','img');overlay.setAttribute('aria-label','Victoria Blackwood crosses the bedroom');
        overlay.innerHTML='<img id="chapel-attack-image" alt=""><p id="chapel-attack-caption"></p>';
        api.$('stage').appendChild(overlay);
      }
      overlayImage=doc.getElementById('chapel-attack-image');
      overlayCaption=doc.getElementById('chapel-attack-caption');
      win=doc.getElementById('chapel-win');
      if(!win&&doc.createElement){
        win=doc.createElement('div');
        win.id='chapel-win';win.className='chapel-win';
        api.$('stage').appendChild(win);
      }
    }
    // ---------- the win screen ----------
    function showWin(st){
      mount();
      if(!win)return;
      const id=st.dateFrom,profile=api.profile(id),v=data.date.victory;
      const portrait=profile?.gallery?.[0]?api.assetUrl(profile.gallery[0]):'';
      win.innerHTML=`<img class="backdrop" src="${esc(api.assetUrl(v.backdrop))}" alt=""><div class="veil"></div><div class="card"><div class="frame"><img src="${esc(api.assetUrl(v.picture))}" alt="${esc(nameOf(id))} at your door"></div><h2>${esc(v.title)}</h2><p class="sub">${esc(fill(v.subtitle,{name:nameOf(id)}))}</p><p class="line">${esc(fill(v.line,{day:st.wonDay??today()}))}</p><button data-chapel-choice="new-game">${esc(v.newGame)}</button></div>`;
      const img=win.querySelector?.('.frame img');
      if(img&&portrait)img.onerror=()=>{img.onerror=null;img.src=portrait;}; // her own photo until the picture at your door exists
      win.classList.add('visible');
      api.playUiSound(660);
    }
    function hideWin(){win?.classList?.remove('visible');}
    function clearTimers(){
      for(const id of attackTimers)api.cancel(id);
      attackTimers=[];
    }
    function hideOverlay(){overlay?.classList.remove('visible','jolt','devouring');}
    // Always fatal: premonition, threshold, charge, lunge, blackout, death.
    function startAttack(reason){
      const st=state();
      if(!st||st.dead)return;
      clearTimers();mount();
      st.attackPending=false;st.attackRunning=true;
      st.attackReason=FATAL.includes(reason)?reason:(st.attackReason||'confront');
      const phase=LIGHTING[api.timePhase()]?api.timePhase():'bedroom-night';
      st.attackPhase=phase;
      caseOpen=false;
      api.setLowered(true);api.setDoor(true);
      overlay.classList.remove('jolt','devouring');
      overlay.classList.add('visible');
      overlayImage.src=api.assetUrl(data.death.warningImage);
      overlayCaption.textContent=data.death.warningCaption;
      api.playUiSound(120);
      STAGES.forEach((stage,index)=>{
        attackTimers.push(api.later(()=>{
          if(!state()?.attackRunning)return;
          overlayCaption.textContent='';
          overlayImage.src=api.assetUrl(attackFrame(phase,index));
          overlay.classList.remove('jolt');void overlay.offsetWidth;overlay.classList.add('jolt');
          api.playUiSound(190+index*120);api.vibrate([150+index*60,80,200]);
        },ATTACK.frames[index]));
      });
      attackTimers.push(api.later(()=>{
        if(!state()?.attackRunning)return;
        overlay.classList.remove('jolt');overlay.classList.add('devouring');api.playUiSound(70);
      },ATTACK.devour));
      attackTimers.push(api.later(()=>{const st=state();if(st?.attackRunning)showDeath(deathKind(st));},ATTACK.death));
    }
    // 'chapel-ritual': the rite went ahead. 'chapel-victoria': she came for you first,
    // or despite the Sisters.
    function deathKind(st){return st.ritualCompleted?'chapel-ritual':'chapel-victoria';}
    // THE ONE DEATH HOOK for every fatal Chapel outcome. It uses the game's death
    // screen. The caption never says why: deaths in MATCH stay unexplained.
    function showDeath(kind){
      const st=state();
      if(!st)return;
      clearTimers();
      st.attackRunning=false;st.dead=true;st.death=st.attackReason||'confront';st.deathKind=kind;
      hideOverlay();
      const captions=data.death.captions;
      const text=captions[Math.floor(seeded(`${api.world().seed}:caption`)()*captions.length)];
      if(typeof api.showDeath==='function'&&api.showDeath(kind,{reason:st.death,text})!==false)return;
      api.drawDeathTitle(data.death.cause,data.death.verb);
      const fatal=api.$('fatal-overlay');
      if(fatalBackground===null)fatalBackground=fatal.style.backgroundImage||'';
      fatal.style.backgroundImage=`linear-gradient(#16040bc4,#16040bc4),url("${api.assetUrl(data.death.background)}")`;
      const caption=fatal.querySelector('p');
      if(caption)caption.textContent=text;
      fatal.classList.add('visible');
      api.playUiSound(60);
    }
    function restoreFatalBackground(){
      if(fatalBackground===null)return;
      api.$('fatal-overlay').style.backgroundImage=fatalBackground;
      fatalBackground=null;
    }

    // ---------- Hinge options ----------
    function button(action,label,{mark='☾',extra=''}={}){
      return `<button class="hinge-chat-choice chapel-choice ${extra}" data-chapel-choice="${esc(action)}">${mark} ${esc(label)}</button>`;
    }
    // Returns {html, only}. With only=true the quest choices replace the
    // ordinary small-talk topics, keeping the list short on small phones.
    function optionsFor(thread){
      const st=sync();
      if(!st||!st.active||st.dead||!thread)return null;
      const id=thread.id,profile=api.profile(id);
      const kind=id===VICTORIA?'victoria':isGoth(profile)?'goth':isSister(profile)?'sister':null;
      if(!kind||isClosed(id))return null;
      const mark=kind==='sister'?'✝':'☾';
      let choices=[],entry='';
      if(st.outcome){
        if(kind==='sister'||st.won)return null;
        const date=dateChoices(st,id);
        if(!date.length)return {html:'<div class="story-tag">The night of the rite is over.</div>',only:false};
        choices=date.map(act=>button(`d:${id}:${act}`,data.date.actions[act].label));
        entry=data.date.entry;
      }else if(kind==='victoria'){
        choices=victoriaChoices(st).map(act=>button(`v:${act}`,data.victoria.actions[act].label));
        entry=st.hostKnown?'Talk about her Midnight Rite':data.victoria.actions.flyers.entry;
      }else if(kind==='goth'){
        choices=gothChoices(st,id).map(act=>button(`g:${id}:${act}`,data.gothActions[act].label));
        entry=st.hostKnown?'Talk about Victoria’s rite':'Talk about the Midnight Rite';
      }else{
        // A Sister takes the place only once you have both halves: which night, and a chapel to name.
        choices=[...(st.nightKnown?[]:[button(`m:${id}`,data.moon.sister.label,{mark})]),...(ready(st)?PLACES.map(place=>button(`s:${id}:${place}`,fill(data.sisterTalk.label,{short:placeShort(place)}),{mark})):[])];
        entry=fill(data.sisterTalk.entry);
      }
      if(!choices.length)return null;
      if(!questMode.has(id))return {html:button(`qmode:${id}:on`,entry,{mark,extra:'chapel-entry'}),only:false};
      return {html:choices.join('')+button(`qmode:${id}:off`,'Back to small talk',{mark:'‹'}),only:true};
    }

    // ---------- case page (shown in the bedside cupboard) ----------
    function otherGoths(){
      return [...api.threads().values()].map(thread=>thread.id).filter(id=>!FLYER_GOTHS.includes(id)&&isGoth(api.profile(id)));
    }
    // One line per person. You can only message a woman you've matched with on Hinge, and a girl
    // from the flyer goes by what the flyer credits her with until you know her name. The tags say
    // how you can reach her: (number), (Hinge), or both.
    function personLine(st,id){
      const profile=api.profile(id);
      if(!profile)return '';
      const thread=threadOf(id),closed=isClosed(id),flyer=FLYER_GOTHS.includes(id);
      if(flyer&&!thread&&!flyerRead(st)&&!st.goths[id]?.named)return ''; // you haven't seen the flyer that credits her
      const canMessage=!!thread&&!closed;
      const number=knowsNumber(st,id),flyerLine=FLYER_NUMBERS.includes(id)&&flyerRead(st)?flyerNumber(st,id):null;
      const tags=[number?'number':'',thread?'Hinge':''].filter(Boolean);
      const name=knowsName(st,id)?profile.name:(data.flyerGoths[id]?.unknown||'Someone');
      let status;
      if(id===VICTORIA&&!st.hostKnown){
        // Nobody has told you whose rite it is: the file knows only the initials on the flyer.
        return `<div class="chapel-person"><b>${flyerRead(st)?'V.B.':'The host'}</b><small>${flyerRead(st)?'Signs the flyers. Nobody has told you who that is.':'Nobody has told you who is holding it.'}</small></div>`;
      }
      if(id===VICTORIA){
        status=!thread?'Hosts the rite. You haven’t matched with her.':st.outcome&&!st.ritualCompleted?'Arrested at the chapel door.':closed?'Not speaking to you.':st.victoria.going?'Hosts the rite. You said you would come.':'Hosts the rite.';
      }else{
        const g=st.goths[id];
        const credited=flyer&&flyerRead(st)&&knowsName(st,id); // what the flyer says she does, once you've seen it
        status=[credited?data.flyerGoths[id].credit+'.':'',!flyer||(thread&&!credited)?'On Hinge.':'',flyerLine?`${data.flyerGoths[id].numberNote}: ${flyerLine}.`:'',
          flyer&&!thread?'You haven’t matched with her.':'',closed?'Not speaking to you.':'',g?.told?'Told you what she knows.':''].filter(Boolean).join(' ');
      }
      const call=flyerLine&&!closed?`<button class="chapel-btn" data-note-dial="${esc(flyerLine)}">☎ Call</button>`:'';
      return `<div class="chapel-person"><b>${esc(name)}</b>${tags.length?` <small>(${tags.join(', ')})</small>`:''} ${canMessage?`<button class="chapel-btn" data-chapel-choice="msg:${id}">Message</button>`:''}${call}<small>${esc(status)}</small></div>`;
    }
    // One short hint: a nudge from what you've heard, never the answer, never about danger.
    function hintFor(st){
      if(st.outcome||st.dead||st.warned)return null;
      const kinds=new Set(st.clues.map(c=>c.kind));
      const moon='Somebody who keeps track of the moon would know which night.';
      if(kinds.has('riddle')||kinds.has('victoria'))return !st.nightKnown?`You know where to look. ${moon}`:canReachSisters(st)?'The Sisters can’t keep watch everywhere.':'A Sister of Mercy can put you in touch.';
      if(kinds.has('never')&&kinds.has('chalk'))return st.nightKnown?'Two clues, three chapels.':`Two clues, three chapels. ${moon}`;
      if(kinds.has('never')||kinds.has('chalk'))return st.nightKnown?'That rules one chapel out. Somebody else knows more.':`That rules one chapel out. ${moon}`;
      if(!st.nightKnown)return 'The Sisters will need two things from you: which chapel, and which night.';
      return flyerRead(st)?'The girls on the flyer know more than the flyer does.':'The goth crowd knows more than it lets on.';
    }
    function statusText(st){
      if(st.dead)return 'The case is closed.';
      if(st.outcome)return `${st.resultText} Case closed.`;
      const told=st.warned?` The Sisters will keep watch at ${placeName(st.warned)}.`:'';
      const rite=st.hostKnown?'Victoria Blackwood’s Midnight Rite':'The Midnight Rite';
      if(!st.nightKnown)return `${rite} is on the next moonless night. Nobody has told you which night, or where.${told}`;
      return `${rite} is ${relNights(st.riteDay)}. Nobody will say where.${told}`;
    }
    function caseHtml(st){
      const list=items=>`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
      const heard=st.clues.length?list(st.clues.map(c=>c.text)):'<p>Nothing yet. Make friends with the goth crowd, and read the paper.</p>';
      let sisters;
      if(st.outcome)sisters=`<p>${esc(st.resultText)}</p>`;
      else{
        const now=st.warned?`<p>The Sisters will keep watch at <b>${esc(placeName(st.warned))}</b> on the night.</p>`:'<p>You haven’t told the Sisters anything yet.</p>';
        // Word can only be sent once you have both halves: which night, and a chapel to name.
        const send=!ready(st)?'<p>They will need to know which chapel, and which night.</p>':canReachSisters(st)?
          `<p><b>${st.warned?'Change your answer':'Send word: the rite is at'}</b></p><div class="chapel-row">${PLACES.map(place=>`<button class="chapel-btn ${st.warned===place?'on':''}" data-chapel-choice="warn:${place}">${esc(placeShort(place))}</button>`).join('')}</div>`:
          '<p>You need a way to reach them. Any Sister of Mercy will give you St. Brigid’s number if you ask her.</p>';
        sisters=now+send;
      }
      // The three chapels are listed once something points at a chapel at all.
      const where=placeClue(st)?`<p>It will be in one of the city’s three old chapels.</p>${list(PLACES.map(place=>data.places[place].guide))}`:'<p>Nobody will say where.</p>';
      return `<div class="chapel-case"><button class="profile-back chapel-back" data-chapel-choice="close-case">‹ Cupboard</button><h3>☾ The Chapel at Midnight</h3><p class="chapel-status">${esc(statusText(st))}</p>${hintFor(st)?`<p class="chapel-hint">Hint: ${esc(hintFor(st))}</p>`:''}`+
        `<h4>Where?</h4><div class="paper">${where}</div>`+
        `<h4>What you’ve heard</h4><div class="paper">${heard}</div>`+
        `<h4>The Sisters of Mercy</h4><div class="paper">${sisters}</div>`+
        `<h4>The goth crowd</h4><div class="paper">${[VICTORIA,...FLYER_GOTHS,...otherGoths()].map(id=>personLine(st,id)).join('')}</div>`+
        `<h4>Case journal</h4><div class="paper">${st.journal.length?list(st.journal.slice(-6).reverse().map(entry=>`Day ${entry.day}: ${entry.text}`)):'<p>Nothing yet.</p>'}</div></div>`;
    }
    function renderCase(){
      const st=sync();
      if(!st)return;
      caseOpen=true;
      const el=api.caseRoot?api.caseRoot():api.$('opened'); // the host decides where the case page lives
      el.innerHTML=caseHtml(st);
      api.hydrate(el);
    }
    function notesEntry(){
      caseOpen=false;
      const st=sync();
      if(!st||!st.active)return '';
      return `<h3>Cases</h3><div class="paper"><button class="notes-call" data-chapel-choice="open-case">☾ The Chapel at Midnight ›</button><p>${esc(statusText(st))}</p></div>`;
    }

    // ---------- player choices ----------
    function message(st,id){
      const profile=api.profile(id);
      if(!profile)return;
      const thread=threadOf(id);
      if(!thread)return; // you have to match with her on Hinge first, Victoria and the flyer girls alike
      if(!thread.blocked&&!thread.fumbled){thread.awaiting=false;thread.ghosted=false;}
      caseOpen=false;
      api.openChat(id);
    }
    // Dialling the DJ's bookings line or the Black Lace shop: she answers with her name. Ask about
    // the rite and she won't discuss it with a stranger, but she's on Hinge: she turns up in your
    // deck soon and likes you back. Asking still gets talked about (a whisper).
    function dialFlyer(number){
      const st=sync();
      if(!st||!st.active||st.dead||st.outcome||!flyerRead(st))return null;
      const id=FLYER_NUMBERS.find(key=>st.numbers?.[key]===String(number));
      const profile=id&&api.profile(id),info=id&&data.flyerGoths[id];
      if(!profile||!info)return null;
      const g=gothState(st,id);
      if(!g.named){g.named=true;journal(st,`You rang the number on the flyer. It was ${profile.name}.`);}
      const key=`service:chapel-goth:${id}`;
      if(api.serviceTopics){
        api.serviceTopics[key]=g.rang||threadOf(id)?[]:[{id:`chapel_ring_${id}`,label:info.askLabel,reply:info.askReply,onChoose:()=>{
          const now=state();if(!now)return;
          const girl=gothState(now,id);
          if(girl.rang)return;
          girl.rang=true;whisper(now);learnHost(now,profile.name.split(' ')[0]); // she names Victoria
          journal(now,`${profile.name} wouldn’t talk about the rite on the phone. She’s on Hinge.`);
          if(api.toDeck)api.toDeck(id);
        }}];
      }
      return {id:key,name:profile.name,portrait:profile.gallery?.[0]||'assets/icons/calls.png',generic:true,greeting:info.greeting};
    }
    // Hinge asks this on a swipe: a flyer girl you've rung likes you back.
    function likesYou(id){
      const st=sync();
      return !!(st&&st.active&&!threadOf(id)&&((FLYER_GOTHS.includes(id)&&st.goths[id]?.rang)||(st.dateFrom===id&&!st.dateOffered)));
    }
    function choose(action){
      const st=sync();
      if(!st)return;
      const [kind,a,b]=String(action).split(':');
      if(st.dead&&kind!=='close-case')return;
      // A woman who has signed off for the day answers no more questions about the rite until tomorrow.
      const asked=kind==='v'?VICTORIA:['g','s','m','d'].includes(kind)||(kind==='qmode'&&b==='on')?a:null;
      if(asked&&api.chatDone?.(asked)){questMode.delete(asked);api.rerender();return;}
      switch(kind){
        case 'open-case':caseOpen=true;renderCase();return;
        case 'close-case':caseOpen=false;if(api.closeCase)api.closeCase();else api.openApp('notes');return;
        case 'msg':if(st.active)message(st,a);return;
        case 'qmode':if(b==='on')questMode.add(a);else questMode.delete(a);api.rerender();return;
        case 'g':gothAct(st,a,b);return;
        case 'v':victoriaAct(st,a);return;
        case 's':sisterAct(st,a,b);return;
        case 'm':sisterMoon(st,a);return;
        case 'd':dateAct(st,a,b);return;
        case 'new-game':if(st.won&&api.startNewRun)api.startNewRun();return;
        case 'warn':if(canReachSisters(st))warn(st,a);break;
        default:return;
      }
      refresh();
    }

    // ---------- run lifecycle ----------
    function reset(){
      clearTimers();hideOverlay();hideWin();restoreFatalBackground();
      caseOpen=false;questMode.clear();
      ensureServiceTopics(false);
    }
    function afterLoad(){
      clearTimers();hideOverlay();hideWin();restoreFatalBackground();
      caseOpen=false;questMode.clear();
      const world=api.world();
      if(!data||!world)return;
      // The old, longer quest had Victoria message you unasked. Now you must match with her
      // first, so an old save loses that uninvited chat (a real match starts with her hello).
      if(world.chapel&&world.chapel.v===1){
        const victoria=threadOf(VICTORIA);
        if(victoria&&OLD_OPENINGS.includes(victoria.log?.[0]?.text))api.threads().delete(VICTORIA);
      }
      world.chapel=normalize(world.chapel,world);
      const st=state();
      syncTopics(st);
      if(st.dead){showDeath(st.deathKind||deathKind(st));return;}
      if(st.won){api.world().victory={type:'date',bride:st.dateFrom,day:st.wonDay??today()};showWin(st);return;}
      if(st.attackRunning||st.attackPending)startAttack(st.attackReason);
    }
    // Workbench shortcut: open the case today.
    function previewNow(){
      const st=state();
      if(!st)return false;
      if(!st.active){st.enabled=true;start(st,'workbench');} // the testing shortcut always opens the case
      api.status('The Chapel at Midnight is open. The case file is in your bedside cupboard.');
      caseOpen=false;
      if(api.showCase)api.showCase();else api.openApp('notes');
      return true;
    }
    // Workbench shortcut: play Victoria's attack now, in the room's current
    // lighting, like the bear preview. Always fatal.
    function previewAttack(){
      const st=state();
      if(!st||st.dead||st.attackRunning)return false;
      startAttack('confront');
      return true;
    }

    mount();
    const previewButton=api.$('chapel-preview');
    if(previewButton&&previewButton.addEventListener)previewButton.addEventListener('click',()=>{if(!state()?.dead)previewNow();});

    return {
      statusLine:()=>{const st=sync();return st?statusText(st):'';},
      onNewDay,afterDayStart,decorateEdition,optionsFor,choose,notesEntry,renderCase,afterLoad,reset,previewNow,previewAttack,
      onMatch,onPaperOpened,dialFlyer,likesYou,
      // A friend finds out which night the moon goes dark (a favour in preview.html). Returns the night, or null.
      tellNight:who=>{const st=sync();if(!st||!st.active||st.nightKnown||st.outcome||st.dead||st.riteDay===null)return null;learnNight(st,who);return relNights(st.riteDay);},
      isCaseOpen:()=>caseOpen,
      isWon:()=>!!state()?.won,
      win:()=>({visible:!!win?.classList?.contains('visible'),html:win?.innerHTML||''}),
      hasData:()=>!!data,
      // Read-only helpers for tests and debugging.
      state:()=>sync(),roleOf:id=>{const st=state();return st?roleOf(st,id):null;},
      overlay:()=>({image:overlayImage?.src||'',caption:overlayCaption?.textContent||'',visible:!!overlay?.classList.contains('visible')})
    };
  }

  root.MATCH_CHAPEL_ENGINE={create,attackFrame,LIGHTING,STAGES,ids:{VICTORIA,FLYER_GOTHS,PLACES}};
})(typeof window!=='undefined'?window:globalThis);
